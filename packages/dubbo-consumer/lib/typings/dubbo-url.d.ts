/**
 *
 * parse dubbo service url
 *
 * @param dubboUrl dubbo的url
 */
export default class DubboUrl {
  private readonly url
  private readonly query
  readonly hostname: string
  readonly port: number
  readonly path: string
  readonly dubboVersion: string
  readonly version: string
  readonly group: string
  private constructor()
  static from(dubboServiceUrl: string): DubboUrl
}
