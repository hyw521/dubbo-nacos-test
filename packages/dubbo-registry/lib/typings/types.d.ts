/// <reference types="node" />
export declare type TDubboInterface = string
export declare type TDubboUrl = string
export interface ITimeoutProps {
  maxTimeout?: number
  onTimeout: () => void
}
export interface INaocsClientProps {
  namespace?: string
  connect: string
  logger?: Console
}
export interface IRegistrySubscriber {
  onData: (map: Map<TDubboInterface, Array<TDubboUrl>>) => void
  onError: (err: Error) => void
}
export interface IZkClientConfig {
  connect: string
  timeout?: number
  debug_level?: number
  host_order_deterministic?: boolean
  zkRootPath?: string
}
export interface INodeProps {
  path: string
  data?: Buffer | string
  isPersistent?: boolean
}
