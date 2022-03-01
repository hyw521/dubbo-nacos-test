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
exports.Nacos = exports.NacosRegistry = void 0
const debug_1 = __importDefault(require('debug'))
const registry_base_1 = __importDefault(require('./registry-base'))
const querystring_1 = __importDefault(require('querystring'))
const apache_dubbo_common_1 = require('apache-dubbo-common')
// log
const dlog = (0, debug_1.default)('dubbo:nacos~')
const NacosNamingClient = require('nacos').NacosNamingClient
// nacos debug
class NacosRegistry extends registry_base_1.default {
  constructor(nacosProps) {
    NacosRegistry.checkProps(nacosProps)
    super()
    dlog(`init nacos with %O`, nacosProps)
    this.nacosProps = nacosProps
    this.nacosProps.namespace = this.nacosProps.namespace || 'default'
    // init ready promise
    this.readyPromise = new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
    // init nacos client
    this.init()
  }
  // ~~~~~~~~~~~~~~~~ private ~~~~~~~~~~~~~~~~~~~~~~~~~~
  // nacos connect
  async init() {
    // support nacos cluster
    let serverList = this.nacosProps.connect.split(',')
    let namespace = this.nacosProps.namespace || 'public'
    let logger = this.nacosProps.logger || console
    dlog(`connecting nacos server ${serverList}`)
    this.client = new NacosNamingClient({
      serverList,
      namespace,
      logger
    })
    try {
      await this.client.ready()
      this.resolve()
    } catch (err) {
      this.reject(err)
    }
  }
  ready() {
    return this.readyPromise
  }
  async findDubboServiceUrls(dubboInterfaces) {
    dlog('find dubbo service urls => %O', dubboInterfaces)
    await Promise.all(
      dubboInterfaces.map((dubboInterface) =>
        this.findDubboServiceUrl(dubboInterface)
      )
    )
  }
  async findDubboServiceUrl(dubboInterface) {
    this.client.subscribe(dubboInterface, (dubboServiceUrls) => {
      dlog('dubboServiceUrls => %O', dubboServiceUrls)
      const urls = dubboServiceUrls.map((item) => {
        const { ip, port, serviceName, metadata } = item
        const inf = serviceName.split('@@')[1]
        return `beehive://${ip}:${port}/${inf}?${querystring_1.default.stringify(
          metadata
        )}`
      })
      this.dubboServiceUrlMap.set(dubboInterface, urls)
      dlog('urls => %O', urls)
      this.emitData(this.dubboServiceUrlMap)
    })
  }
  // 注册服务提供
  async registerServices(services) {
    dlog('services => %O', services)
    for (let { dubboServiceInterface, dubboServiceUrl } of services) {
      await this.registerInstance(dubboServiceInterface, dubboServiceUrl)
    }
  }
  // 注册服务消费
  async registerConsumers(consumers) {
    dlog('consumers => %O', consumers)
    const dubboInterfaces = new Set()
    for (let { dubboServiceInterface, dubboServiceUrl } of consumers) {
      dubboInterfaces.add(dubboServiceInterface)
      await this.registerInstance(dubboServiceInterface, dubboServiceUrl)
    }
    await this.findDubboServiceUrls([...dubboInterfaces])
  }
  async registerInstance(dubboServiceInterface, dubboServiceUrl) {
    const metadata = {}
    const urlObj = new URL(dubboServiceUrl)
    dlog('urlObj => %O', urlObj)
    const { hostname: ip, port, searchParams } = urlObj
    for (const key of searchParams.keys()) {
      metadata[key] = searchParams.get(key)
    }
    await this.client.registerInstance(dubboServiceInterface, {
      ip,
      port: port || 80,
      metadata
    })
  }
  close() {
    var _a
    ;(_a = this.client) === null || _a === void 0 ? void 0 : _a.close()
  }
  getClient() {
    return this.client
  }
  /**
   * check nacos prop
   * @param props
   */
  static checkProps(props) {
    if (!props.connect) {
      throw new Error(`Please specify nacos props, connect is required`)
    }
    if (!apache_dubbo_common_1.util.isString(props.connect)) {
      throw new Error(`Please specify nacos props, connect should be a string`)
    }
    if (
      props.namespace &&
      !apache_dubbo_common_1.util.isString(props.namespace)
    ) {
      throw new Error(
        `Please specify nacos props, namespace should be a string`
      )
    }
    if (!props.logger) {
      throw new Error(`Please specify nacos props, logger is required`)
    }
  }
}
exports.NacosRegistry = NacosRegistry
function Nacos(props) {
  return new NacosRegistry(props)
}
exports.Nacos = Nacos
