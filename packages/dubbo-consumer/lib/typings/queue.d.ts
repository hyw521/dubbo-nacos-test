import Context from './context'
import { IDubboObservable, IDubboResponse, TQueueObserver } from './types'
/**
 * Node的异步特性就会让我们在思考问题的时候，要转换一下思考问题的思维
 * 无论是zookeeper的连接，还是socket的创建都是异步的特性。
 * 但是请求的incoming的时候，整体可能还没有初始化结束，如果我们试图去阻塞
 * 就会导致整个编程架构很痛苦。
 * 所有简单的处理就是，每次处理请求incoming的时候先把请求参数推入队列，然后
 * 等待后面的资源初始化结束进行处理，如果超过超时时间就自动进行timeout超时处理
 */
export default class Queue implements IDubboObservable<TQueueObserver> {
  private subscriber
  private readonly queue
  constructor()
  static init(): Queue
  private clear
  push: (ctx: Context) => Promise<unknown>
  /**
   * 获取当前请求队列
   */
  get requestQueue(): Map<number, Context<any>>
  subscribe(cb: Function): this
  consume(msg: IDubboResponse): void
}
