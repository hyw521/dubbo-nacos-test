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
exports.FaultExitError =
  exports.ZookeeperExpiredError =
  exports.SocketError =
  exports.DubboScheduleError =
  exports.DubboMethodParamNotHessianError =
  exports.DubboTimeoutError =
  exports.DubboEncodeError =
  exports.DubboInvokeTimeout =
    void 0
class DubboInvokeTimeout extends Error {}
exports.DubboInvokeTimeout = DubboInvokeTimeout
class DubboEncodeError extends Error {}
exports.DubboEncodeError = DubboEncodeError
class DubboTimeoutError extends Error {}
exports.DubboTimeoutError = DubboTimeoutError
class DubboMethodParamNotHessianError extends Error {}
exports.DubboMethodParamNotHessianError = DubboMethodParamNotHessianError
class DubboScheduleError extends Error {}
exports.DubboScheduleError = DubboScheduleError
class SocketError extends Error {}
exports.SocketError = SocketError
class ZookeeperExpiredError extends Error {}
exports.ZookeeperExpiredError = ZookeeperExpiredError
class FaultExitError extends Error {
  //copy message and stack
  constructor(err) {
    super(err.message)
    this.message = err.message
    this.stack = err.stack
    this.name = err.name
  }
}
exports.FaultExitError = FaultExitError
