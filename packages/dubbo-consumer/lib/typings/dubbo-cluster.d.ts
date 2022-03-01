import DubboTcpTransport from './dubbo-tcp-transport'
import {
  IDubboObservable,
  IDubboTransportSubscriber,
  HostName,
  Host
} from './types'
/**
 * Management container for machine agent and dubbo-tcp-transport
 * Cluster can be understood as an abstraction of a dubbo service server
 */
export default class DubboCluster
  implements IDubboObservable<IDubboTransportSubscriber>
{
  private subscriber
  private readonly dubboClusterTransportMap
  constructor()
  private handleTransportClose
  private updateDubboClusterTransports
  private addDubboClusterTransports
  setDubboClusterTransport(transports: Map<HostName, Set<Host>>): void
  isClusterReady(hostname: HostName): boolean
  getClusterReadyDubboTransports(hostname: HostName): DubboTcpTransport[]
  getAllReadyClusterHosts(hostnames: Set<HostName>): string[]
  getAvailableDubboTransport(hostnames: Set<HostName>): DubboTcpTransport
  subscribe(subscriber: IDubboTransportSubscriber): this
  refresh(serviceHostMap: Map<HostName, Set<Host>>): void
  close(): void
}
