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
exports.Nacos =
  exports.NacosRegistry =
  exports.ZookeeperRegistry =
  exports.Zk =
  exports.BaseRegistry =
    void 0
const registry_base_1 = __importDefault(require('./registry-base'))
exports.BaseRegistry = registry_base_1.default
const registry_zookeeper_1 = require('./registry-zookeeper')
Object.defineProperty(exports, 'Zk', {
  enumerable: true,
  get: function () {
    return registry_zookeeper_1.Zk
  }
})
Object.defineProperty(exports, 'ZookeeperRegistry', {
  enumerable: true,
  get: function () {
    return registry_zookeeper_1.ZookeeperRegistry
  }
})
const registry_nacos_1 = require('./registry-nacos')
Object.defineProperty(exports, 'NacosRegistry', {
  enumerable: true,
  get: function () {
    return registry_nacos_1.NacosRegistry
  }
})
Object.defineProperty(exports, 'Nacos', {
  enumerable: true,
  get: function () {
    return registry_nacos_1.Nacos
  }
})
