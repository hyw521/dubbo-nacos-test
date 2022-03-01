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
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k
        var desc = Object.getOwnPropertyDescriptor(m, k)
        if (
          !desc ||
          ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k]
            }
          }
        }
        Object.defineProperty(o, k2, desc)
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k
        o[k2] = m[k]
      })
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v })
      }
    : function (o, v) {
        o['default'] = v
      })
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod
    var result = {}
    if (mod != null)
      for (var k in mod)
        if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k)
    __setModuleDefault(result, mod)
    return result
  }
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
const debug_1 = __importDefault(require('debug'))
const koa_compose_1 = __importDefault(require('koa-compose'))
const queue_1 = __importDefault(require('./queue'))
const config_1 = __importDefault(require('./config'))
const context_1 = __importDefault(require('./context'))
const apache_dubbo_common_1 = require('apache-dubbo-common')
const scheduler_1 = __importDefault(require('./scheduler'))
const querystring_1 = __importDefault(require('querystring'))
// import ip from 'ip'
const s = __importStar(require('./dubbo-setting'))
const log = (0, debug_1.default)('dubbo:bootstrap')
const packageVersion = require('../package.json').version
log('dubbo-js version :=> %s', packageVersion)
/**
 * Dubbo
 *
 * 1. Connect to the registration center zookeeper
 * 2. Initiate method call of remote dubbo service
 * 3. Serialization/deserialization of dubbo protocol
 * 4. Manage tcp connection and heartbeat
 * 5. The corresponding method of automatically proxying interface through proxy mechanism
 * 6. Provide quick test interface in direct connection mode
 * 7. Middleware
 * 8. Full link tracking of dubbo calls can be realized through zone-context
 * 9. Centralized message management
 */
class Dubbo {
  constructor(props) {
    this.composeService = (provider) => {
      const { application, isSupportedDubbox } = this.props
      const {
        dubboInterface,
        methods,
        timeout = 5000,
        group,
        version,
        ip,
        port
      } = provider
      const proxyObj = Object.create(null)
      this.consumers.push({
        dubboServiceInterface: dubboInterface,
        dubboServiceUrl: `consumer://${ip}:${port}/${dubboInterface}?${querystring_1.default.stringify(
          {
            application: this.props.application.name,
            interface: dubboInterface,
            category: 'consumers',
            methods: Object.keys(methods).join(','),
            revision: version,
            version: version,
            group: group,
            timeout: timeout,
            side: 'consumer',
            check: false,
            pid: process.pid
          }
        )}`
      })
      //proxy methods
      Object.keys(methods).forEach((name) => {
        proxyObj[name] = async (...args) => {
          log('%s create context', name)
          //创建dubbo调用的上下文
          const ctx = context_1.default.init()
          ctx.application = application
          ctx.isSupportedDubbox = isSupportedDubbox
          // set dubbo version
          ctx.dubboVersion = this.props.dubboVersion
          const method = methods[name]
          ctx.methodName = name
          ctx.methodArgs = method.call(provider, ...args) || []
          ctx.dubboInterface = dubboInterface
          ctx.version = version
          ctx.timeout = timeout
          ctx.group = group
          const self = this
          const middlewares = [
            ...this.middlewares,
            async function handleRequest(ctx) {
              log('start middleware handle dubbo request')
              ctx.body = await (0, apache_dubbo_common_1.go)(
                self.queue.push(ctx)
              )
              log('end handle dubbo request')
            }
          ]
          log('middleware->', middlewares)
          const fn = (0, koa_compose_1.default)(middlewares)
          try {
            await fn(ctx)
          } catch (err) {
            log(err)
          }
          return ctx.body
        }
      })
      return proxyObj
    }
    this.props = props
    // check dubbo register
    if (!apache_dubbo_common_1.util.isObj(this.props.registry)) {
      throw new Error('please specify registry instance')
    }
    this.consumers = []
    this.middlewares = []
    this.queue = queue_1.default.init()
    this.dubboSetting = props.dubboSetting || s.Setting()
    // init service
    this.service = {}
    this.consumeService(this.props.services)
    log('consumerService: %O', this.consumers)
    //Initialize config
    //Global timeout (maximum fusing time) similar to <dubbo:consumer timeout="sometime"/>
    //For the consumer client, if the user sets the interface level timeout time, the interface level is used
    //If the user does not set the user level, the default is the maximum timeout
    const { dubboInvokeTimeout } = props
    config_1.default.dubboInvokeTimeout =
      dubboInvokeTimeout ||
      this.dubboSetting.maxTimeout ||
      config_1.default.dubboInvokeTimeout
    log('config:|> %O', config_1.default)
    this.init().catch((err) => console.log(err))
  }
  // ========================private method=======================
  async init() {
    await this.props.registry.ready()
    //create scheduler
    this.scheduler = scheduler_1.default.from(this.props.registry, this.queue)
    await this.props.registry.registerConsumers(this.consumers)
  }
  /**
   * registry consume service
   * service style:
   * {[key: string]: (dubbo): T => dubbo.proxyService<T>({...})}
   * @param services
   */
  consumeService(services) {
    for (let [shortName, serviceProxy] of Object.entries(services)) {
      const service = serviceProxy(this)
      const meta = this.dubboSetting.getDubboSetting({
        dubboServiceShortName: shortName,
        dubboServiceInterface: service.dubboInterface
      })
      service.group = meta.group
      service.version = meta.version
      service.ip = meta.ip
      service.port = meta.port
      this.service[shortName] = this.composeService(service)
    }
  }
  //========================public method===================
  /**
   * static factory method
   * @param props
   */
  static from(props) {
    return new Dubbo(props)
  }
  /**
   * 代理dubbo的服务
   */
  proxyService(provider) {
    return provider
  }
  /**
   * extends middleware, api: the same as koa
   * @param fn
   */
  use(fn) {
    if (typeof fn != 'function') {
      throw new TypeError('middleware must be a function')
    }
    log('use middleware %s', fn._name || fn.name || '-')
    this.middlewares.push(fn)
    return this
  }
  /**
   * The connection of dubbo is asynchronous. Whether the connection is successful or not is usually known at runtime.
   * At this time, it may give us some trouble, we must send a request to know the status of dubbo
   * Based on this scenario, we provide a method to tell the outside whether dubbo is initialized successfully,
   * In this way, we will know the connection status of dubbo during node startup, if we can't connect, we can
   * Timely fixed
   *
   * For example, in conjunction with egg, egg provides a beforeStart method
   * Wait for the successful initialization of dubbo through the ready method
   *
   * //app.js
   * export default (app: EggApplication) => {
   * const dubbo = Dubbo.from({....})
   * app.beforeStart(async () => {
   *  await dubbo.ready();
   *  console.log('dubbo was ready...');
   * })
   *}
   *
   * Other frameworks are similar
   */
  ready() {
    return this.props.registry.ready()
  }
  /**
   * close dubbo consumer, usually used in test suite
   */
  close() {
    this.props.registry.close()
    this.scheduler.close()
  }
}
exports.default = Dubbo
