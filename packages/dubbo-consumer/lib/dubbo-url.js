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
const querystring_1 = __importDefault(require('querystring'))
const log = (0, debug_1.default)('dubbo:dubbo-url')
/**
 *
 * parse dubbo service url
 *
 * @param dubboUrl dubbo的url
 */
class DubboUrl {
  constructor(dubboServiceUrl) {
    log('DubboUrl from -> %s', dubboServiceUrl)
    this.url = new URL(dubboServiceUrl)
    this.query = querystring_1.default.parse(dubboServiceUrl)
    this.hostname = this.url.hostname
    this.port = Number(this.url.port)
    this.path = this.url.pathname.substring(1)
    this.dubboVersion = this.query.dubbo || ''
    this.version =
      this.query.version || this.query['default.version'] || '0.0.0'
    this.group = this.query.group || this.query['default.group'] || ''
  }
  static from(dubboServiceUrl) {
    return new DubboUrl(dubboServiceUrl)
  }
}
exports.default = DubboUrl
