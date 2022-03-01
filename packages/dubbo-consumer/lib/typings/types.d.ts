import { IRegistry } from 'apache-dubbo-registry'
import DubboTcpTransport from './dubbo-tcp-transport'
import { DubboSetting } from './dubbo-setting'
export declare type TQueueObserver = Function
export declare type TRequestId = number
export declare type TDubboInterface = string
export declare type TDubboUrl = string
export declare type TDubboServiceShortName = string
export declare type TMatchThunk = (
  shortName: TDubboServiceShortName
) => IDubboSetting
export declare type Middleware<T> = (
  context: T,
  next: () => Promise<any>
) => any
export interface IDubboProps {
  application: {
    name: string
  }
  registry: IRegistry<Object>
  services: Object
  isSupportedDubbox?: boolean
  dubboInvokeTimeout?: number
  dubboVersion?: string
  dubboSetting?: DubboSetting
}
export declare type TDubboService<T> = {
  [k in keyof T]: T[k] extends (dubbo: any) => infer R ? R : any
}
export interface IDubboProvider {
  dubboInterface: string
  path?: string
  version?: string
  timeout?: number
  group?: string
  ip: string
  port: number
  methods: {
    [methodName: string]: Function
  }
}
export interface IDirectlyDubboProps {
  dubboHost: string
  dubboVersion: string
  dubboInvokeTimeout?: number
}
export interface IHessianType {
  $class: string
  $: any
}
export interface IInvokeParam {
  dubboInterface: string
  methods: {
    [methodName: string]: Function
  }
  path?: string
  group?: string
  version?: string
  timeout?: number
  attachments?: object
  isSupportedDubbox?: boolean
}
export interface IDubboObservable<T> {
  subscribe(subscriber: T): this
}
export interface IDubboTransportSubscriber {
  onConnect: (props: { host: string; transport: DubboTcpTransport }) => void
  onData: (data: any) => void
  onClose: (host: string) => void
}
export declare type HostName = string
export declare type Host = string
export interface IQueryObj {
  application: string
  dubbo: string
  interface: string
  path: string
  methods: string
  version: string
  group: string
}
export interface IDubboSetting {
  group?: string
  version?: string
  timeout?: number
}
export interface IDubboSetting {
  group?: string
  version?: string
  timeout?: number
}
export interface IDubboResult<T> {
  err: Error
  res: T
}
export declare type TDubboCallResult<T> = Promise<IDubboResult<T>>
export interface IContextRequestParam {
  requestId: number
  dubboVersion: string
  dubboInterface: string
  path: string
  methodName: string
  methodArgs: Array<IHessianType>
  version: string
  timeout: number
  group: string
}
export interface IDubboResponse {
  requestId: number
  res?: any
  err?: Error
  attachments?: Object
}
