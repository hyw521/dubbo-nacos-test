import Queue from './queue'
import { IRegistry } from 'apache-dubbo-registry'
/**
 * scheduler
 * 1. subscribe registry
 * 2. subscribe dubbo-cluster
 * 3. resolve queue
 */
export default class Scheduler {
  private status
  private readonly queue
  private readonly registry
  private readonly refreshTimer
  private readonly dubboCluster
  private readonly dubboServiceUrlMapper
  constructor(registry: IRegistry<any>, queue: Queue)
  static from(registry: IRegistry<any>, queue: Queue): Scheduler
  close(): void
  private refreshDubboCluster
  /**
   * handle request in queue
   * @param ctx
   */
  private handleQueueMessage
  private handleRegistryServiceChange
  private handleRegistryError
  private handleDubboInvoke
  private handleDubboClusterConnect
  private sendRequest
  private handleTransportData
  private handleTransportClose
  private findDubboClusterByService
  private isHostCanResolveService
  private findDubboUrlByHost
}
