import { ScopeToken } from "./ScopeToken";
import { Token } from "./Token";

export interface ImportBindOptions {
  to: Token;
  from: Token;
  inScope?: ScopeToken;
}
