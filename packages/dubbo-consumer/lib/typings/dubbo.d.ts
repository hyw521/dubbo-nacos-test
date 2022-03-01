import Context from './context'
import { IDubboProps, IDubboProvider, Middleware, TDubboService } from './types'
/**
 * Dubbo
 *
 * 1. Connect to the registration center zookeeper
 * 2. Initiate method call of remote dubbo service
 * 3. Serialization/deserialization of dubbo protocol
 * 4. Manage tcp connection and heartbeat
 * 5. The corresponding method of automatically proxying interface through proxy mechanism
 * 6. Provide quick test interface in direct connection mode
 * 7. Middleware
 * 8. Full link tracking of dubbo calls can be realized through zone-context
 * 9. Centralized message management
 */
export default class Dubbo<TService = Object> {
  private readonly queue
  private readonly dubboSetting
  private readonly props
  private readonly middlewares
  private readonly consumers
  private scheduler
  readonly service: TDubboService<TService>
  constructor(props: IDubboProps)
  private init
  /**
   * registry consume service
   * service style:
   * {[key: string]: (dubbo): T => dubbo.proxyService<T>({...})}
   * @param services
   */
  private consumeService
  private composeService
  /**
   * static factory method
   * @param props
   */
  static from(props: IDubboProps): Dubbo<Object>
  /**
   * 代理dubbo的服务
   */
  proxyService<T = any>(provider: IDubboProvider): T
  /**
   * extends middleware, api: the same as koa
   * @param fn
   */
  use(fn: Middleware<Context>): this
  /**
   * The connection of dubbo is asynchronous. Whether the connection is successful or not is usually known at runtime.
   * At this time, it may give us some trouble, we must send a request to know the status of dubbo
   * Based on this scenario, we provide a method to tell the outside whether dubbo is initialized successfully,
   * In this way, we will know the connection status of dubbo during node startup, if we can't connect, we can
   * Timely fixed
   *
   * For example, in conjunction with egg, egg provides a beforeStart method
   * Wait for the successful initialization of dubbo through the ready method
   *
   * //app.js
   * export default (app: EggApplication) => {
   * const dubbo = Dubbo.from({....})
   * app.beforeStart(async () => {
   *  await dubbo.ready();
   *  console.log('dubbo was ready...');
   * })
   *}
   *
   * Other frameworks are similar
   */
  ready(): Promise<void>
  /**
   * close dubbo consumer, usually used in test suite
   */
  close(): void
}
