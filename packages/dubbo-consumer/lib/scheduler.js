'use strict'
/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
const debug_1 = __importDefault(require('debug'))
const dubbo_cluster_1 = __importDefault(require('./dubbo-cluster'))
const dubbo_url_1 = __importDefault(require('./dubbo-url'))
const err_1 = require('./err')
const apache_dubbo_serialization_1 = require('apache-dubbo-serialization')
const log = (0, debug_1.default)('dubbo:scheduler')
/**
 * scheduler
 * 1. subscribe registry
 * 2. subscribe dubbo-cluster
 * 3. resolve queue
 */
class Scheduler {
  constructor(registry, queue) {
    /**
     * handle request in queue
     * @param ctx
     */
    this.handleQueueMessage = (ctx) => {
      log(`handle requestId %d, current status: %s`, ctx.requestId, this.status)
      switch (this.status) {
        case 'ready' /* READY */:
          this.handleDubboInvoke(ctx)
          break
        case 'padding' /* PADDING */:
          log('current scheduler was padding, please waiting...')
          break
        case 'failed' /* FAILED */:
          this.queue.consume({
            requestId: ctx.requestId,
            err: new err_1.DubboScheduleError('registry occur fatal error')
          })
          break
        default:
          log('schedule unknown status')
      }
    }
    this.handleRegistryServiceChange = (map) => {
      log(`get all cluster info:=> %O`, map)
      const transportMap = new Map()
      for (let [dubboInterface, dubboUrls] of map) {
        // if registry get dubbo url is empty,
        // but in memory dubbo interface map dubbo url is not empty
        // don't override it.
        if (
          dubboUrls.length === 0 &&
          this.dubboServiceUrlMapper.get(dubboInterface)
        ) {
          return
        }
        this.dubboServiceUrlMapper.set(
          dubboInterface,
          dubboUrls.map((dubboUrl) => {
            const url = dubbo_url_1.default.from(dubboUrl)
            const hostname = url.hostname
            const host = `${url.hostname}:${url.port}`
            if (transportMap.has(hostname)) {
              transportMap.get(hostname).add(host)
            } else {
              transportMap.set(hostname, new Set([host]))
            }
            return url
          })
        )
      }
      this.dubboCluster.setDubboClusterTransport(transportMap)
    }
    this.handleRegistryError = (err) => {
      log(err)
      if (this.status !== 'ready' /* READY */) {
        this.status = 'failed' /* FAILED */
      }
    }
    this.handleDubboClusterConnect = ({ host, transport }) => {
      log('scheduler receive dubbo-tcp-transport connect %s', host)
      this.status = 'ready' /* READY */
      const hostname = host.split(':')[0]
      for (let ctx of this.queue.requestQueue.values()) {
        if (!ctx.wasInvoked && this.isHostCanResolveService(ctx, hostname)) {
          this.sendRequest(ctx, transport)
        }
      }
    }
    this.handleTransportData = ({ requestId, res, err, attachments }) => {
      this.queue.consume({
        requestId,
        res,
        err,
        attachments
      })
    }
    this.handleTransportClose = (host) => {
      log(`dubbo-tcp-transport was close %s`, host)
      // search context by host in queue, re-dispatch
      const { requestQueue } = this.queue
      for (let ctx of requestQueue.values()) {
        if (ctx.invokedByHost === host) {
          this.handleDubboInvoke(ctx)
        }
      }
    }
    log(`new scheduler`)
    this.status = 'padding' /* PADDING */
    // init queue
    this.queue = queue
    this.queue.subscribe(this.handleQueueMessage)
    // init service url mapper
    this.dubboServiceUrlMapper = new Map()
    // init dubbo cluster
    this.dubboCluster = new dubbo_cluster_1.default()
    this.dubboCluster.subscribe({
      onConnect: this.handleDubboClusterConnect,
      onData: (data) => {
        this.handleTransportData(data)
      },
      onClose: this.handleTransportClose
    })
    this.refreshTimer = setInterval(() => {
      this.refreshDubboCluster()
    }, 10 * 1000)
    // init registry
    this.registry = registry
    this.registry.subscribe({
      onData: this.handleRegistryServiceChange,
      onError: this.handleRegistryError
    })
  }
  static from(registry, queue) {
    return new Scheduler(registry, queue)
  }
  close() {
    clearTimeout(this.refreshTimer)
    this.dubboCluster.close()
  }
  refreshDubboCluster() {
    const serviceHostMap = new Map()
    for (let urls of this.dubboServiceUrlMapper.values()) {
      for (let { hostname, port } of urls) {
        const host = `${hostname}:${port}`
        if (serviceHostMap.has(hostname)) {
          serviceHostMap.get(hostname).add(host)
        } else {
          serviceHostMap.set(hostname, new Set([host]))
        }
      }
    }
    log('refreshDubboCluster with map %O', serviceHostMap)
    this.dubboCluster.refresh(serviceHostMap)
  }
  handleDubboInvoke(ctx) {
    const { requestId, dubboInterface, version, group } = ctx
    const hostnames = this.findDubboClusterByService(ctx)
    if (hostnames.size === 0) {
      this.queue.consume({
        requestId: ctx.requestId,
        err: new err_1.DubboScheduleError(
          `Could not find any agent worker with ${dubboInterface}`
        )
      })
      return
    }
    const transport = this.dubboCluster.getAvailableDubboTransport(hostnames)
    if (!transport) {
      this.queue.consume({
        requestId,
        err: new err_1.DubboScheduleError(
          `${dubboInterface}?group=${group}&version=${version}`
        )
      })
      return
    }
    // send request
    this.sendRequest(ctx, transport)
  }
  sendRequest(ctx, transport) {
    ctx.invokedByHost = transport.host
    const url = this.findDubboUrlByHost(ctx.dubboInterface, transport.host)
    ctx.request.dubboVersion =
      ctx.request.dubboVersion ||
      url.dubboVersion ||
      apache_dubbo_serialization_1.DEFAULT_DUBBO_PROTOCOL_VERSION
    ctx.request.path = url.path
    transport.write(ctx)
  }
  findDubboClusterByService(ctx) {
    const { dubboInterface, version, group } = ctx
    return this.dubboServiceUrlMapper
      .get(dubboInterface)
      .filter((url) => {
        // "*" refer to default wildcard in dubbo
        const isSameVersion =
          !version || version == '*' || url.version === version
        //如果Group为null，就默认匹配， 不检查group
        //如果Group不为null，确保group和接口的group一致
        const isSameGroup = !group || group === url.group
        return isSameGroup && isSameVersion
      })
      .reduce((reducer, prop) => {
        reducer.add(prop.hostname)
        return reducer
      }, new Set())
  }
  isHostCanResolveService(ctx, hostname) {
    const hosts = this.findDubboClusterByService(ctx)
    return hosts.has(hostname)
  }
  findDubboUrlByHost(dubboInterface, host) {
    const [hostname, port] = host.split(':')
    const dubboUrls = this.dubboServiceUrlMapper.get(dubboInterface)
    return dubboUrls.find(
      (url) => url.hostname === hostname && url.port === Number(port)
    )
  }
}
exports.default = Scheduler
