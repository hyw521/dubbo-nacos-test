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
exports.Zk = exports.ZookeeperRegistry = void 0
const debug_1 = __importDefault(require('debug'))
const zookeeper_1 = __importDefault(require('zookeeper'))
const registry_base_1 = __importDefault(require('./registry-base'))
const timeout_1 = __importDefault(require('./timeout'))
const DUBBO_ZK_ROOT_PATH = '/dubbo'
const dlog = (0, debug_1.default)('dubbo:zookeeper~')
class ZookeeperRegistry extends registry_base_1.default {
  constructor(props) {
    super()
    dlog(`init zookeeper with %O`, props)
    ZookeeperRegistry.checkProps(props)
    this.props = props
    this.props.zkRootPath = this.props.zkRootPath || DUBBO_ZK_ROOT_PATH
    // init ready promise
    this.readyPromise = new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
    this.timeout = new timeout_1.default({
      maxTimeout: this.props.timeout || 40 * 1000,
      onTimeout: () => {
        this.reject(
          new Error(`zookeeper connect ${this.props.connect} timeout`)
        )
        this.close()
      }
    })
    this.init()
  }
  // ~~~~~~~~~~~~~~~~ private ~~~~~~~~~~~~~~~~~~~~~~~~~~
  static checkProps(props) {
    if (!props.connect) {
      throw new Error(`Please specify zookeeper connect url`)
    }
  }
  init() {
    if (this.client) {
      return
    }
    // set default props value
    this.props.timeout = this.props.timeout || 40 * 1000
    this.props.debug_level =
      this.props.debug_level || zookeeper_1.default.constants.ZOO_LOG_LEVEL_WARN
    this.props.host_order_deterministic =
      this.props.host_order_deterministic || false
    dlog('connecting zookeeper with %O', this.props)
    this.client = new zookeeper_1.default(this.props)
    this.client.on('connect', async () => {
      dlog('connected with zookeeper with %s', this.props.connect)
      this.timeout.clearTimeout()
      try {
        // create root node
        await this.mkdirp(this.props.zkRootPath)
        // trigger ready promise
        this.resolve()
      } catch (err) {
        this.reject(err)
      }
    })
    this.client.on('close', () => {
      dlog(`zookeeper closed`)
      this.emitErr(new Error(`Zookeeper was closed`))
      this.close()
      this.init()
    })
    this.client.on('error', (err) => {
      dlog(`zookeeper error %s`, err)
      this.reject(err)
      this.emitErr(err)
    })
    process.nextTick(() => {
      this.client.init({})
    })
  }
  async createNode(cfg) {
    dlog(`create zookeeper node %j`, cfg)
    const { path, data = '', isPersistent = false } = cfg
    try {
      await this.client.exists(path, false)
      dlog(`${path} node was existed ~`)
    } catch (err) {
      await this.client.create(
        path,
        data,
        isPersistent
          ? zookeeper_1.default.constants.ZOO_PERSISTENT
          : zookeeper_1.default.constants.ZOO_EPHEMERAL
      )
    }
  }
  async mkdirp(path) {
    return new Promise((resolve, reject) => {
      this.client.mkdirp(path, (err) => {
        if (err) {
          dlog(`mkdir %s error %s`, path, err)
          reject(err)
        } else {
          dlog('mkdir %s ok', path)
          resolve()
        }
      })
    })
  }
  wrapWatch(dubboInterface) {
    const servicePath = `${this.props.zkRootPath}/${dubboInterface}/providers`
    return async (type, state) => {
      dlog('wrapWatch %s %d %d', servicePath, type, state)
      await this.findDubboServiceUrl(dubboInterface)
      this.emitData(this.dubboServiceUrlMap)
    }
  }
  // ~~~~~~~~~~~~~~~~ public ~~~~~~~~~~~~~~~~~~~~~~~~~~
  getProps() {
    return this.props
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
    this.emitData(this.dubboServiceUrlMap)
  }
  async findDubboServiceUrl(dubboInterface) {
    const servicePath = `${this.props.zkRootPath}/${dubboInterface}/providers`
    const urls = (
      await this.client
        .w_get_children(servicePath, this.wrapWatch(dubboInterface))
        .catch((err) => {
          dlog(
            `get beehive service urls err %s %s %s`,
            servicePath,
            dubboInterface,
            err
          )
          return []
        })
    )
      .map((v) => decodeURIComponent(v))
      .filter((v) => v.startsWith('dubbo://'))
    this.dubboServiceUrlMap.set(dubboInterface, urls)
  }
  async registerServices(services) {
    for (let { dubboServiceInterface, dubboServiceUrl } of services) {
      // create service root path
      const serviceRootPath = `${this.props.zkRootPath}/${dubboServiceInterface}/providers`
      await this.mkdirp(serviceRootPath)
      // create service node
      await this.createNode({
        path: `${serviceRootPath}/${encodeURIComponent(dubboServiceUrl)}`
      })
    }
  }
  async registerConsumers(consumers) {
    dlog('registry consumers => %O', consumers)
    const dubboInterfaces = new Set()
    // registry consumer
    for (let { dubboServiceInterface, dubboServiceUrl } of consumers) {
      dubboInterfaces.add(dubboServiceInterface)
      // create consumer root path
      const consumerRootPath = `${this.props.zkRootPath}/${dubboServiceInterface}/consumers`
      await this.mkdirp(consumerRootPath)
      // create service node
      await this.createNode({
        path: `${consumerRootPath}/${encodeURIComponent(dubboServiceUrl)}`
      })
    }
    await this.findDubboServiceUrls([...dubboInterfaces])
  }
  close() {
    var _a, _b
    this.timeout.clearTimeout()
    ;(_a = this.client) === null || _a === void 0
      ? void 0
      : _a.removeAllListeners()
    ;(_b = this.client) === null || _b === void 0 ? void 0 : _b.close()
    this.client = null
  }
  getClient() {
    return this.client
  }
}
exports.ZookeeperRegistry = ZookeeperRegistry
function Zk(props) {
  return new ZookeeperRegistry(props)
}
exports.Zk = Zk
