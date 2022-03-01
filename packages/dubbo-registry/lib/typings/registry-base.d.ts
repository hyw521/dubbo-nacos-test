import { IRegistrySubscriber, TDubboInterface, TDubboUrl } from './types'
/**
 * Extract the base class of the registry
 */
export default class BaseRegistry {
  protected readonly subscribers: Set<IRegistrySubscriber>
  protected readonly dubboServiceUrlMap: Map<TDubboInterface, Array<TDubboUrl>>
  constructor()
  subscribe(subscriber: IRegistrySubscriber): this
  unsubscribe(subscriber: IRegistrySubscriber): void
  emitData(map: Map<TDubboInterface, Array<TDubboUrl>>): void
  emitErr(err: Error): void
}
