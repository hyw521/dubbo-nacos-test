import { IContextRequestParam, IDubboResult, IHessianType } from './types'
export default class Context<T = any> {
  /**
   * dubbo设置的application
   */
  private readonly _application
  /**
   * 当前dubbo请求的参数
   */
  private readonly _request
  /**
   * 当前dubbo返回的结果
   */
  private _body
  /**
   * 扩展attachments,支持自定义一些属性可以放在dubbo的encoder底层协议的attachment字段中
   */
  private _attachments
  /**
   * dubbo2.6.3 增加了 provider => consumer的attachments的能力
   * https://github.com/apache/incubator-dubbo/issues/889
   */
  private _providerAttachments
  /**
   * 是否支持dubbox,不希望通过版本2.8x来判断，不够语义化
   */
  private _isSupportedDubbox
  /**
   * 当前上下文唯一的id，方便全链路日志跟踪
   */
  private _traceId
  private _invokedByHost
  private timer
  private _timeout
  /**
   * 当前promise的resolve
   */
  private _resolve
  /**
   * 当前promise的reject
   */
  private _reject
  private constructor()
  static init<T = any>(): Context<T>
  get isRequestMethodArgsHessianType(): boolean
  get request(): IContextRequestParam
  get body(): IDubboResult<any>
  set body(body: IDubboResult<any>)
  set requestId(requestId: number)
  get requestId(): number
  set methodName(name: string)
  get methodName(): string
  set methodArgs(args: Array<IHessianType>)
  get methodArgs(): Array<IHessianType>
  set dubboInterface(inf: string)
  get dubboInterface(): string
  set dubboVersion(version: string)
  set version(version: string)
  get version(): string
  get dubboVersion(): string
  set group(group: string)
  get group(): string
  set path(path: string)
  get path(): string
  set application(app: { name: string })
  get application(): {
    name: string
  }
  get resolve(): Function
  set resolve(resolve: Function)
  get reject(): Function
  set reject(reject: Function)
  set traceId(uuid: string)
  get traceId(): string
  /**
   * 当前上下文是不是么有被处理被调度
   */
  get wasInvoked(): boolean
  set invokedByHost(host: string)
  get invokedByHost(): string
  set isSupportedDubbox(isSupportedDubbox: boolean)
  get isSupportedDubbox(): boolean
  /**
   * 设置当前的attachments
   * @param param
   */
  set attachments(param: Object)
  /**
   * 获取当前的attachments
   */
  get attachments(): Object
  /**
   * 设置provider传递过来的attachments
   * @since dubbo2.6.3
   */
  set providerAttachments(param: Object)
  /**
   * 设置provider传递过来的attachments
   * @since dubbo2.6.3
   */
  get providerAttachments(): Object
  get timeout(): number
  set timeout(timeout: number)
  setMaxTimeout(end: Function): void
  cleanTimeout(): void
}
