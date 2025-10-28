import { Token } from "./Token";

export interface ScopeContext {
  registry: Map<Token, any>;
  resolving: Map<Token, { lazy: boolean }>;
}