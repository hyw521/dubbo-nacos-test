import {
  IDubboSetting,
  TDubboInterface,
  TDubboServiceShortName,
  TMatchThunk
} from './types'
export declare type TSettingFunctionOption = (setting: DubboSetting) => void
export declare class DubboSetting {
  maxTimeout: number
  private readonly matchDubboInterface
  private readonly matchDubboRegx
  private readonly matchDubboThunk
  constructor()
  service(
    rule: TDubboInterface | Array<TDubboInterface> | RegExp,
    meta: IDubboSetting
  ): void
  serviceThunk(thunk: TMatchThunk): void
  getDubboSetting({
    dubboServiceShortName,
    dubboServiceInterface
  }: {
    dubboServiceShortName?: TDubboServiceShortName
    dubboServiceInterface?: TDubboInterface
  }): {
    group: string
    version: string
    ip: string
    port: number
  }
}
export declare function Setting(
  ...args: Array<TSettingFunctionOption>
): DubboSetting
export declare function maxTimeout(
  timeout: number
): (dubboSetting: DubboSetting) => void
export declare function service(
  rule: TDubboInterface | Array<TDubboInterface> | RegExp,
  meta: IDubboSetting
): (dubboSetting: DubboSetting) => void
export declare function serviceThunk(
  thunk: TMatchThunk
): (dubboSetting: DubboSetting) => void
