export declare class DubboInvokeTimeout extends Error {}
export declare class DubboEncodeError extends Error {}
export declare class DubboTimeoutError extends Error {}
export declare class DubboMethodParamNotHessianError extends Error {}
export declare class DubboScheduleError extends Error {}
export declare class SocketError extends Error {}
export declare class ZookeeperExpiredError extends Error {}
export declare class FaultExitError extends Error {
  constructor(err: Error)
}
