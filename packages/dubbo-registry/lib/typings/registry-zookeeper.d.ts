import Zookeeper from 'zookeeper'
import { IRegistry } from './registry'
import BaseRegistry from './registry-base'
import { IZkClientConfig, TDubboInterface, TDubboUrl } from './types'
export declare class ZookeeperRegistry
  extends BaseRegistry
  implements IRegistry<Zookeeper>
{
  private readonly props
  private client
  private timeout
  private readonly readyPromise
  private resolve
  private reject
  constructor(props: IZkClientConfig)
  private static checkProps
  private init
  private createNode
  private mkdirp
  private wrapWatch
  getProps(): IZkClientConfig
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
  close(): void
  getClient(): Zookeeper
}
export declare function Zk(props: IZkClientConfig): ZookeeperRegistry
