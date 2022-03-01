import Context from './context'
import { STATUS } from './dubbo-status'
import { IDubboObservable, IDubboTransportSubscriber } from './types'
/**
 * 具体处理tcp底层通信的模块
 * 1 负责socket的创建和通信
 * 2.负责dubbo的序列化和反序列化
 * 3.socket断开自动重试
 */
export default class DubboTcpTransport
  implements IDubboObservable<IDubboTransportSubscriber>
{
  readonly host: string
  private _status
  private forceClose
  private retry
  private heartBeat
  private transport
  private subscriber
  private constructor()
  private init
  private onConnected
  private onError
  private onClose
  static from(host: string): DubboTcpTransport
  /**
   * send data to dubbo service
   * @param ctx dubbo context
   */
  write(ctx: Context): void
  get status(): STATUS
  /**
   * current status is whether available or not
   */
  get isAvailable(): boolean
  /**
   * current status whether retry or not
   */
  get isRetry(): boolean
  /**
   * reset and retry at once
   */
  resetThenRetry(): void
  /**
   * subscribe the socket worker events
   * @param subscriber
   */
  subscribe(subscriber: IDubboTransportSubscriber): this
  /**
   * force close tcp transport
   */
  close(): void
}
