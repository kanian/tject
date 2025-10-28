import { ScopeContext } from '../types/ScopeContext';
import { ScopeToken } from '../types/ScopeToken';
import { singleton, transient } from '../types/symbols';
import { Token } from '../types/Token';

const globalScope: ScopeContext = {
  registry: new Map<Token, any>(),
  resolving: new Map<Token, { lazy: boolean }>(),
};

const scopes = new Map<ScopeToken, ScopeContext>();

export const getGlobalScope = (): ScopeContext => globalScope;

export const getScope = (scope: ScopeToken): ScopeContext => {
  let ctx = scopes.get(scope);
  if (!ctx) {
    throw new Error(`Scope not found for token: ${String(scope)}`);
  }
  return ctx;
};

export const createScope = (scope: ScopeToken): ScopeContext => {
  if (scopes.has(scope)) {
    throw new Error(`Scope already exists for token: ${String(scope)}`);
  }
  const ctx: ScopeContext = {
    registry: new Map<Token, any>(),
    resolving: new Map<Token, { lazy: boolean }>(),
  };
  scopes.set(scope, ctx);
  return ctx;
};

export const deleteScope = (scope: ScopeToken): void => {
  if (!scopes.has(scope)) {
    throw new Error(`Scope not found for token: ${String(scope)}`);
  }
  scopes.delete(scope);
};

export const destroyRegistry = (scope?: ScopeToken): void => {
  const reg = getServiceRegistry(scope);
  // Clear all entries in the service registry
  reg.forEach((value, key) => {
    if (value) {
      // Clear singleton instances
      if (value[singleton]) {
        delete value[singleton];
      }
      // Clear transient instances
      if (value[transient]) {
        delete value[transient];
      }
    }
    reg.delete(key);
  });
  reg.clear();
  getResolvingMap(scope).clear();
};

export const destroyRegistries = (): void => {
  // Clear global scope
  destroyRegistry();
  // Clear all scoped registries
  scopes.forEach((ctx, scopeToken) => {
    destroyRegistry(scopeToken);
  });
};

export const getServiceRegistry = (scope?: ScopeToken) => {
  if (!scope) {
    return globalScope.registry;
  }
  return getScope(scope).registry;
};

export const registerService = (
  token: Token,
  service: any,
  scope?: ScopeToken
) => {
  getServiceRegistry(scope).set(token, service);
};

export const getResolvingMap = (scope?: ScopeToken) => {
  if (!scope) {
    return globalScope.resolving;
  }
  return getScope(scope).resolving;
};
