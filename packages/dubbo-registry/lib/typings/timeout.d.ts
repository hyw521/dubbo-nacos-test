import { ITimeoutProps } from './types'
export default class Timeout {
  private readonly maxTimeout
  private readonly timer
  constructor(props: ITimeoutProps)
  clearTimeout(): void
}
