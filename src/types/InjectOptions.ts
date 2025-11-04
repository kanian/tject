import { ScopeToken } from "./ScopeToken"
import { Token } from "./Token"

export type InjectOptions = {
  token: Token,
  lazy?: boolean,
  scope?: ScopeToken,
}