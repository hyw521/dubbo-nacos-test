import BaseRegistry from './registry-base'
import { IRegistry } from './registry'
import { INaocsClientProps, TDubboInterface, TDubboUrl } from './types'
declare const NacosNamingClient: any
export declare class NacosRegistry
  extends BaseRegistry
  implements IRegistry<typeof NacosNamingClient>
{
  private nacosProps
  private client
  private readonly readyPromise
  private resolve
  private reject
  constructor(nacosProps: INaocsClientProps)
  private init
  ready(): Promise<void>
  findDubboServiceUrls(dubboInterfaces: Array<string>): Promise<void>
  findDubboServiceUrl(dubboInterface: string): Promise<void>
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
  registerInstance(
    dubboServiceInterface: string,
    dubboServiceUrl: string
  ): Promise<void>
  close(): void
  getClient(): any
  /**
   * check nacos prop
   * @param props
   */
  private static checkProps
}
export declare function Nacos(props: INaocsClientProps): NacosRegistry
export {}
