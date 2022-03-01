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
const apache_dubbo_common_1 = require('apache-dubbo-common')
const context_1 = __importDefault(require('./context'))
const dubbo_tcp_transport_1 = __importDefault(require('./dubbo-tcp-transport'))
const log = (0, debug_1.default)('dubbo-consumer:directly-dubbo ~')
/**
 * Directly connect to the dubbo service
 * skip the connection to zookeeper
 * usually used to test the service connectivity in development
 */
class DubboDirectlyInvoker {
  constructor(props) {
    //===================socket event===================
    this.handleTransportConnect = () => {
      this.status = 'CONNECTED' /* CONNECTED */
      for (let ctx of this.queue.values()) {
        //如果还没有被处理
        if (!ctx.wasInvoked) {
          ctx.invokedByHost = this.props.dubboHost
          this.transport.write(ctx)
        }
      }
    }
    this.handleTransportData = ({ requestId, res, err }) => {
      log(`receive transport data %d - res: %O - err: %s`, requestId, res, err)
      this.consume({
        requestId,
        err,
        res
      })
    }
    this.handleTransportClose = () => {
      log('socket-worker was closed')
      this.status = 'CLOSED' /* CLOSED */
      //failed all
      for (let ctx of this.queue.values()) {
        ctx.reject(new Error('socket-worker was closed.'))
        ctx.cleanTimeout()
      }
      this.queue.clear()
    }
    log('bootstrap....%O', this.props)
    this.props = props
    this.queue = new Map()
    this.status = 'PADDING' /* PADDING */
    this.transport = dubbo_tcp_transport_1.default
      .from(this.props.dubboHost)
      .subscribe({
        onConnect: this.handleTransportConnect,
        onData: this.handleTransportData,
        onClose: this.handleTransportClose
      })
  }
  static from(props) {
    return new DubboDirectlyInvoker(props)
  }
  close() {
    this.transport.close()
  }
  proxyService(invokeParam) {
    const {
      dubboInterface,
      path,
      methods,
      timeout,
      group = '',
      version = '0.0.0',
      attachments = {},
      isSupportedDubbox = false
    } = invokeParam
    const proxy = Object.create(null)
    for (let methodName of Object.keys(methods)) {
      proxy[methodName] = (...args) => {
        return (0, apache_dubbo_common_1.go)(
          new Promise((resolve, reject) => {
            const ctx = context_1.default.init()
            ctx.resolve = resolve
            ctx.reject = reject
            ctx.methodName = methodName
            const method = methods[methodName]
            ctx.methodArgs = method.call(invokeParam, ...args) || []
            ctx.dubboVersion = this.props.dubboVersion
            ctx.dubboInterface = dubboInterface
            ctx.path = path || dubboInterface
            ctx.group = group
            ctx.timeout = timeout
            ctx.version = version
            ctx.attachments = attachments
            ctx.isSupportedDubbox = isSupportedDubbox
            //check param
            //param should be hessian data type
            if (!ctx.isRequestMethodArgsHessianType) {
              log(
                `${dubboInterface} method: ${methodName} not all arguments are valid hessian type`
              )
              log(`arguments->%O`, ctx.request.methodArgs)
              reject(new Error('not all arguments are valid hessian type'))
              return
            }
            //超时检测
            ctx.timeout = this.props.dubboInvokeTimeout
            ctx.setMaxTimeout(() => {
              this.queue.delete(ctx.requestId)
            })
            //add task to queue
            this.addQueue(ctx)
          })
        )
      }
    }
    return proxy
  }
  // ~~~~~~~~~~~~~~~~private~~~~~~~~~~~~~~~~~~~~~~~~
  /**
   * Successfully process the task of the queue
   *
   * @param requestId
   * @param err
   * @param res
   */
  consume({ requestId, err, res }) {
    const ctx = this.queue.get(requestId)
    if (!ctx) {
      return
    }
    if (err) {
      ctx.reject(err)
    } else {
      ctx.resolve(res)
    }
    ctx.cleanTimeout()
    this.queue.delete(requestId)
  }
  /**
   * add task's context to queue
   *
   * @param ctx
   */
  addQueue(ctx) {
    const { requestId } = ctx
    this.queue.set(requestId, ctx)
    log(`current dubbo transport => ${this.status}`)
    //根据当前socket的worker的状态，来对任务进行处理
    switch (this.status) {
      case 'PADDING' /* PADDING */:
        break
      case 'CONNECTED' /* CONNECTED */:
        this.transport.write(ctx)
        break
      case 'CLOSED' /* CLOSED */:
        this.consume({
          requestId,
          err: new Error(`dubbo transport was closed.`)
        })
        break
    }
  }
}
exports.default = DubboDirectlyInvoker
