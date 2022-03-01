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
Object.defineProperty(exports, '__esModule', { value: true })
exports.serviceThunk =
  exports.service =
  exports.maxTimeout =
  exports.Setting =
  exports.DubboSetting =
    void 0
const apache_dubbo_common_1 = require('apache-dubbo-common')
class DubboSetting {
  constructor() {
    this.maxTimeout = 5 * 1000
    this.matchDubboInterface = new Map()
    this.matchDubboRegx = new Map()
    this.matchDubboThunk = new Set()
  }
  service(rule, meta) {
    if (apache_dubbo_common_1.util.isString(rule)) {
      this.matchDubboInterface.set(rule, meta)
    } else if (apache_dubbo_common_1.util.isArray(rule)) {
      rule.forEach((r) => this.matchDubboInterface.set(r, meta))
    } else if (rule instanceof RegExp) {
      this.matchDubboRegx.set(rule, meta)
    }
  }
  serviceThunk(thunk) {
    this.matchDubboThunk.add(thunk)
  }
  getDubboSetting({ dubboServiceShortName, dubboServiceInterface }) {
    const defaultMeta = {
      group: '',
      version: '0.0.0',
      ip: '127.0.0.1',
      port: 80
    }
    // first, we search thunk
    for (let thunk of this.matchDubboThunk) {
      const meta = thunk(dubboServiceShortName)
      if (meta) {
        return Object.assign(Object.assign({}, defaultMeta), meta)
      }
    }
    // second, search from dubboInterface
    if (this.matchDubboInterface.has(dubboServiceInterface)) {
      const meta = this.matchDubboInterface.get(dubboServiceInterface)
      return Object.assign(Object.assign({}, defaultMeta), meta)
    }
    // third, search from regx
    for (let [r, meta] of this.matchDubboRegx) {
      if (r.test(dubboServiceInterface)) {
        return Object.assign(Object.assign({}, defaultMeta), meta)
      }
    }
    // no service anything
    return defaultMeta
  }
}
exports.DubboSetting = DubboSetting
// ~~~~~~~~~~~~~ factory method ~~~~~~~~~~~~~~~~~~~~~~~~~~~
function Setting(...args) {
  const dubboSetting = new DubboSetting()
  for (let arg of args) {
    arg(dubboSetting)
  }
  return dubboSetting
}
exports.Setting = Setting
function maxTimeout(timeout) {
  return (dubboSetting) => {
    dubboSetting.maxTimeout = timeout
  }
}
exports.maxTimeout = maxTimeout
function service(rule, meta) {
  return (dubboSetting) => {
    return dubboSetting.service(rule, meta)
  }
}
exports.service = service
function serviceThunk(thunk) {
  return (dubboSetting) => {
    dubboSetting.serviceThunk(thunk)
  }
}
exports.serviceThunk = serviceThunk
