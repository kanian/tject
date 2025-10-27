import { Injectable } from '../types/Injectable';
import {
  transient,
  singleton,
  dependencies,
  tokenName,
} from '../types/symbols';
import { Token } from '../types/Token';
import { resolving, serviceRegistry } from './serviceRegistry';

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
  forceNew = false
): T => {
  if (resolving.has(token)) {
    throw new Error(
      `Circular dependency detected! Path: ${[...resolving, token].join(
        ' -> '
      )}`
    );
  }
  resolving.add(token);
  let ctor: U;
  if (typeof token === 'string' || typeof token === 'symbol') {
    const registered = serviceRegistry().get(token);
    if (!registered) {
      resolving.delete(token);
      throw new Error(`No dependency registered for token "${String(token)}"`);
    }

    if (registered.isValue) {
      resolving.delete(token);
      return registered.value;
    }
    ctor = registered; // <-- FIX 2: Assign the class to ctor
    console.log('in inject; resolved token to class:', token, ctor);
    console.log('in inject; class token name:', ctor[tokenName]);
  } else {
    throw new Error(`No dependency registered for token "${String(token)}"`);
  }
  const isTransient = ctor[transient];

  console.log('in inject; registered for token:', token, ctor);

  // For singleton services, return cached instance unless forceNew is true
  if (!forceNew && !isTransient && ctor[singleton]) {
    resolving.delete(token);
    return ctor[singleton];
  }

  console.log('in inject; Injecting service for token:', ctor[tokenName]);
  console.log('in inject; Service dependencies:', ctor[dependencies]);
  const deps = ctor[dependencies] || [];
  const resolvedDeps = deps.map((dep) => {
    console.log('in inject; Resolving dependency for token:', dep.token);
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
  resolving.delete(token);
  return instance;
};
