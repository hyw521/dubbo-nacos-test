import { IRegistrySubscriber, TDubboInterface, TDubboUrl } from './types'
export interface IRegistry<T> {
  ready(): Promise<void>
  findDubboServiceUrls(dubboInterfaces: Array<string>): Promise<void>
  registerServices(
    services: Array<{
      dubboServiceInterface: TDubboInterface
      dubboServiceUrl: TDubboUrl
    }>
  ): Promise<void>
  registerConsumers(
    consumers: Array<{
      dubboServiceInterface: TDubboInterface
      dubboServiceUrl: TDubboUrl
    }>
  ): Promise<void>
  subscribe(cb: IRegistrySubscriber): void
  close(): void
  getClient(): T
}
