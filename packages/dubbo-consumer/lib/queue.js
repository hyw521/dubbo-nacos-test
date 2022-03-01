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
const err_1 = require('./err')
const apache_dubbo_common_1 = require('apache-dubbo-common')
const { noop } = apache_dubbo_common_1.util
const log = (0, debug_1.default)('dubbo:queue')
/**
 * Node的异步特性就会让我们在思考问题的时候，要转换一下思考问题的思维
 * 无论是zookeeper的连接，还是socket的创建都是异步的特性。
 * 但是请求的incoming的时候，整体可能还没有初始化结束，如果我们试图去阻塞
 * 就会导致整个编程架构很痛苦。
 * 所有简单的处理就是，每次处理请求incoming的时候先把请求参数推入队列，然后
 * 等待后面的资源初始化结束进行处理，如果超过超时时间就自动进行timeout超时处理
 */
class Queue {
  constructor() {
    this.push = (ctx) => {
      return new Promise((resolve, reject) => {
        ctx.resolve = resolve
        ctx.reject = reject
        if (!ctx.isRequestMethodArgsHessianType) {
          ctx.reject(
            new err_1.DubboMethodParamNotHessianError(
              `${ctx.dubboInterface}#${ctx.request.methodName} not all arguments are valid hessian type`
            )
          )
          return
        }
        //add queue
        const { requestId, dubboInterface } = ctx.request
        log(`add queue,requestId#${requestId}, interface: ${dubboInterface}`)
        this.queue.set(requestId, ctx)
        // set max timeout
        ctx.setMaxTimeout(() => {
          // delete this context
          this.queue.delete(ctx.requestId)
        })
        //通知scheduler
        this.subscriber(ctx)
      })
    }
    log('new Queue')
    this.queue = new Map()
    this.subscriber = noop
  }
  static init() {
    return new Queue()
  }
  clear(requestId) {
    log(`clear queue #${requestId}`)
    this.queue.delete(requestId)
  }
  /**
   * 获取当前请求队列
   */
  get requestQueue() {
    return this.queue
  }
  subscribe(cb) {
    this.subscriber = cb
    return this
  }
  consume(msg) {
    const { requestId, res, err, attachments } = msg
    const ctx = this.queue.get(requestId)
    if (!ctx) {
      return
    }
    ctx.cleanTimeout()
    //dubbo2.6.3
    ctx.providerAttachments = attachments
    if (err) {
      log(
        'queue schedule failed requestId#%d, traceId:%s err: %s',
        requestId,
        ctx.traceId,
        err
      )
      //删除该属性，不然会导致JSON.Stringify失败
      if (err['cause']) {
        delete err['cause']['cause']
      }
      ctx.reject(err)
    } else {
      log(
        'resolve requestId:%d traceId: %s, res: %O',
        requestId,
        ctx.traceId,
        res
      )
      ctx.resolve(res)
    }
    this.clear(requestId)
  }
}
exports.default = Queue
