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
const net_1 = __importDefault(require('net'))
const debug_1 = __importDefault(require('debug'))
const apache_dubbo_common_1 = require('apache-dubbo-common')
const apache_dubbo_serialization_1 = require('apache-dubbo-serialization')
const log = (0, debug_1.default)('dubbo:tcp-transport ~')
/**
 * 具体处理tcp底层通信的模块
 * 1 负责socket的创建和通信
 * 2.负责dubbo的序列化和反序列化
 * 3.socket断开自动重试
 */
class DubboTcpTransport {
  constructor(host) {
    this.onConnected = () => {
      log('tcp-transport#%s was connected', this.host)
      this.retry.reset()
      this._status = 'CONNECTED' /* CONNECTED */
      this.heartBeat = apache_dubbo_serialization_1.HeartBeat.from({
        type: 'request',
        transport: this.transport,
        onTimeout: () => this.transport.destroy()
      })
      //notify subscriber, the transport was connected successfully
      this.subscriber.onConnect({
        host: this.host,
        transport: this
      })
    }
    this.onError = (err) => {
      log('tcp-transport#%s <=occur error=> %s', this.host, err)
    }
    this.onClose = () => {
      log('tcp-transport#%s was closed', this.host)
      this._status = 'CLOSED' /* CLOSED */
      if (!this.forceClose) {
        this.retry.start()
      }
    }
    log('init tcp-transport with %s:%s status: %s', host, this._status)
    this.host = host
    this.forceClose = false
    this._status = 'PADDING' /* PADDING */
    //init subscriber
    this.subscriber = {
      onConnect: apache_dubbo_common_1.util.noop,
      onData: apache_dubbo_common_1.util.noop,
      onClose: apache_dubbo_common_1.util.noop
    }
    this.retry = new apache_dubbo_common_1.Retry({
      maxRetry: 120,
      delay: 500,
      retry: () => {
        this._status = 'RETRY' /* RETRY */
        this.init()
      },
      end: () => {
        this.subscriber.onClose(this.host)
      }
    })
    //init socket
    this.init()
  }
  //==========================private method================================
  init() {
    log(`tcp-transport =connecting=> ${this.host}`)
    const [host, port] = this.host.split(':')
    this.transport = new net_1.default.Socket()
    this.transport.setNoDelay()
    this.transport
      .connect(Number(port), host, this.onConnected)
      .on('error', this.onError)
      .on('close', this.onClose)
    apache_dubbo_serialization_1.DecodeBuffer.from(
      this.transport,
      `tcp-transport#${this.host}`
    ).subscribe((data) => {
      if (apache_dubbo_serialization_1.HeartBeat.isHeartBeat(data)) {
        log('tcp-transport#%s <=receive= heartbeat data.', this.host)
      } else {
        const res = (0, apache_dubbo_serialization_1.decodeDubboResponse)(data)
        log('tcp-transport#%s <=received=> dubbo result %O', this.host, res)
        this.subscriber.onData(res)
      }
    })
  }
  //==================================public method==========================
  static from(host) {
    return new DubboTcpTransport(host)
  }
  /**
   * send data to dubbo service
   * @param ctx dubbo context
   */
  write(ctx) {
    log('tcp-transport#%s invoke request #%d', this.host, ctx.requestId)
    // update heartbeat lastWriteTimestamp
    this.heartBeat.setWriteTimestamp()
    // send dubbo serialization request data
    this.transport.write(
      new apache_dubbo_serialization_1.DubboRequestEncoder(ctx).encode()
    )
  }
  get status() {
    return this._status
  }
  /**
   * current status is whether available or not
   */
  get isAvailable() {
    return this._status === 'CONNECTED' /* CONNECTED */
  }
  /**
   * current status whether retry or not
   */
  get isRetry() {
    return this._status === 'RETRY' /* RETRY */
  }
  /**
   * reset and retry at once
   */
  resetThenRetry() {
    this.retry.reset()
    this.retry.start()
  }
  /**
   * subscribe the socket worker events
   * @param subscriber
   */
  subscribe(subscriber) {
    this.subscriber = subscriber
    return this
  }
  /**
   * force close tcp transport
   */
  close() {
    this.forceClose = true
    this.transport.destroy()
  }
}
exports.default = DubboTcpTransport
