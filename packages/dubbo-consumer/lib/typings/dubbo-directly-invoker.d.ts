import { IDirectlyDubboProps, IInvokeParam } from './types'
/**
 * Directly connect to the dubbo service
 * skip the connection to zookeeper
 * usually used to test the service connectivity in development
 */
export default class DubboDirectlyInvoker {
  private status
  private readonly props
  private readonly transport
  private readonly queue
  constructor(props: IDirectlyDubboProps)
  static from(props: IDirectlyDubboProps): DubboDirectlyInvoker
  close(): void
  proxyService<T extends Object>(invokeParam: IInvokeParam): T
  /**
   * Successfully process the task of the queue
   *
   * @param requestId
   * @param err
   * @param res
   */
  private consume
  /**
   * add task's context to queue
   *
   * @param ctx
   */
  private addQueue
  private handleTransportConnect
  private handleTransportData
  private handleTransportClose
}
