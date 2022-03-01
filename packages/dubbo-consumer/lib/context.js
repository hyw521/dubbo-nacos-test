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
const config_1 = __importDefault(require('./config'))
const request_id_1 = require('./request-id')
const apache_dubbo_common_1 = require('apache-dubbo-common')
const err_1 = require('./err')
const log = (0, debug_1.default)('dubbo:context')
class Context {
  constructor() {
    log('new Context')
    this._traceId = ''
    this._invokedByHost = ''
    this._isSupportedDubbox = false
    this._body = { err: null, res: null }
    this._application = { name: 'dubbo-js' }
    this._attachments = {}
    this._providerAttachments = {}
    this._request = {
      requestId: (0, request_id_1.id)(),
      group: ''
    }
    // max timeout
    this._timeout = this._request.timeout || config_1.default.dubboInvokeTimeout
  }
  static init() {
    return new Context()
  }
  get isRequestMethodArgsHessianType() {
    const { methodArgs } = this._request
    return methodArgs.every(apache_dubbo_common_1.util.checkHessianParam)
  }
  get request() {
    return this._request
  }
  get body() {
    return this._body
  }
  set body(body) {
    this._body = body
  }
  //=====================dubboRequest setter&&getter==========================
  set requestId(requestId) {
    log('requestId#%d set requestId: %d', this._request.requestId, requestId)
    this._request.requestId = requestId
  }
  get requestId() {
    return this._request.requestId
  }
  set methodName(name) {
    log('requestId#%d set methodName: %s', this._request.requestId, name)
    this._request.methodName = name
  }
  get methodName() {
    return this._request.methodName
  }
  set methodArgs(args) {
    log('requestId#%d set methodArgs: %O', this._request.requestId, args)
    this._request.methodArgs = args
  }
  get methodArgs() {
    return this._request.methodArgs
  }
  set dubboInterface(inf) {
    log('requestId#%d set dubboInterface: %s', this._request.requestId, inf)
    this._request.dubboInterface = inf
  }
  get dubboInterface() {
    return this._request.dubboInterface
  }
  set dubboVersion(version) {
    log('requestId#%d set dubboVersion: %s', this._request.requestId, version)
    this._request.dubboVersion = version
  }
  set version(version) {
    log('requestId#%d set version: %s', this._request.requestId, version)
    this._request.version = version
  }
  get version() {
    return this._request.version
  }
  get dubboVersion() {
    return this._request.dubboVersion
  }
  set group(group) {
    log('requestId#%d set group: %s', this._request.requestId, group)
    this._request.group = group
  }
  get group() {
    return this._request.group
  }
  set path(path) {
    log('requestId#%d set path: %d', this._request.requestId, path)
    this._request.path = path
  }
  get path() {
    return this._request.path
  }
  //===============application setter=========================
  set application(app) {
    log('requestId#%d set application: %O', this._request.requestId, app)
    this._application.name = app.name
  }
  get application() {
    return this._application
  }
  //===============resolve && reject=============================
  get resolve() {
    return this._resolve
  }
  set resolve(resolve) {
    this._resolve = resolve
  }
  get reject() {
    return this._reject
  }
  set reject(reject) {
    log('requestId#%d set reject: %O', this._request.requestId, reject)
    this._reject = reject
  }
  //============uuid setter&&getter==============
  set traceId(uuid) {
    this._traceId = uuid
  }
  get traceId() {
    return this._traceId
  }
  /**
   * 当前上下文是不是么有被处理被调度
   */
  get wasInvoked() {
    return this._invokedByHost != ''
  }
  set invokedByHost(host) {
    this._invokedByHost = host
  }
  get invokedByHost() {
    return this._invokedByHost
  }
  //======================isSupportedDubbox================
  set isSupportedDubbox(isSupportedDubbox) {
    this._isSupportedDubbox = isSupportedDubbox
  }
  get isSupportedDubbox() {
    return this._isSupportedDubbox
  }
  //=====================attachments=======================
  /**
   * 设置当前的attachments
   * @param param
   */
  set attachments(param) {
    log('set attachments->%o', param)
    //auto merge
    this._attachments = Object.assign(
      Object.assign({}, this._attachments),
      param
    )
  }
  /**
   * 获取当前的attachments
   */
  get attachments() {
    return this._attachments
  }
  /**
   * 设置provider传递过来的attachments
   * @since dubbo2.6.3
   */
  set providerAttachments(param) {
    log('set provider attachments->%o', param)
    this._providerAttachments = param
  }
  /**
   * 设置provider传递过来的attachments
   * @since dubbo2.6.3
   */
  get providerAttachments() {
    return this._providerAttachments
  }
  //===================timeout=========================
  get timeout() {
    return this._timeout
  }
  set timeout(timeout) {
    this._timeout = timeout || config_1.default.dubboInvokeTimeout
  }
  setMaxTimeout(end) {
    log(
      'requestId#%d, set max timeout handler, max timeout: %d',
      this.requestId,
      this._timeout
    )
    this.timer = setTimeout(() => {
      this.reject &&
        this.reject(
          new err_1.DubboInvokeTimeout(
            `invoke ${this.dubboInterface}#${this.methodName}?group=${this.group}&version=${this.version}`
          )
        )
      end()
      this.cleanTimeout()
    }, this._timeout)
  }
  cleanTimeout() {
    log('clean requestId#%d timeout', this.requestId)
    clearTimeout(this.timer)
  }
}
exports.default = Context
