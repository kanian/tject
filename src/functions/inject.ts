import { Injectable } from '../types/Injectable';
import { ScopeToken } from '../types/ScopeToken';
import {
  transient,
  singleton,
  dependencies,
  tokenName,
} from '../types/symbols';
import { Token } from '../types/Token';
import { getResolvingMap, getServiceRegistry } from './registries';

/**
 * Injects a service based on the provided token.
 * If the token is a string or symbol, it will look up the registered service.
 * If the token is a class, it will instantiate the class and resolve its dependencies.
 * If the service is registered as a singleton, it will return the cached instance unless forceNew is true.
 * If the service is registered as transient, a new instance will be created each time.
 * If the service is registered as a value, it will return the value directly.
 * @param token The token to resolve the service.
 * @typeParam T The type of the service to resolve.
 * @param forceNew Whether or not to force a new instance of the service.
 * @returns The resolved service instance.
 * @throws Error if the service is not registered or if a dependency cannot be resolved.
 */

export const inject = <T, U extends Injectable<T> = Injectable<T>>(
  token: Token,
  forceNew = false,
  scope?: ScopeToken
): T => {
  const resolvingMap = getResolvingMap(scope);
  if (resolvingMap.has(token) && !resolvingMap.get(token)?.lazy) {
    throw new Error(
      `Circular dependency detected! Path: ${[...resolvingMap, token].join(
        ' -> '
      )}`
    );
  }
  resolvingMap.set(token, { lazy: false });
  let ctor: U;
  // if (typeof token === 'string' || typeof token === 'symbol') {
  const registered = getServiceRegistry(scope).get(token);
  if (!registered) {
    resolvingMap.delete(token);
    throw new Error(`No dependency registered for token "${String(token)}"`);
  }

  if (registered.isValue) {
    resolvingMap.delete(token);
    return registered.value;
  }
  ctor = registered; // <-- FIX 2: Assign the class to ctor

  // } else {
  //   throw new Error(`No dependency registered for token "${String(token)}"`);
  // }
  const isTransient = ctor[transient];

  // For singleton services, return cached instance unless forceNew is true
  if (!forceNew && !isTransient && ctor[singleton]) {
    resolvingMap.delete(token);
    return ctor[singleton];
  }

  const deps = ctor[dependencies] || [];
  const resolvedDeps = deps.map((dep) => {
    const depInstance = inject(dep.token);
    if (!depInstance) {
      throw new Error(
        `Failed to resolve dependency for token "${String(dep.token)}"`
      );
    }
    return depInstance;
  });

  const instance = new ctor(...resolvedDeps);

  // Only cache singleton instances
  if (!isTransient && !forceNew) {
    ctor[singleton] = instance;
  }
  resolvingMap.delete(token);
  return instance;
};
