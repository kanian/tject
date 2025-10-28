import { Injectable } from '../types/Injectable';
import { ServiceOptions } from '../types/ServiceOptions';
import {
  transient,
  tokenName,
  dependencies,
  singleton,
} from '../types/symbols';
import { Token } from '../types/Token';
import { serviceRegistry } from '../functions/serviceRegistry';
import { getTokenName } from '../functions/getTokenName';
import { inject } from '../functions/inject';

/**
 * Modern Service decorator using TS 5+ decorator syntax.
 * Providers listed in 'dependencies' are now treated as an UNORDERED list
 * of required tokens, which the module resolver will use alongside constructor
 * type information to resolve parameters.
 */
export function Service(options?: ServiceOptions) {
  return function <T extends Injectable<any>>(
    target: T,
    context: ClassDecoratorContext<T>
  ): void {
    // Important: Use target (the class) directly, not this.constructor
    const ctor = target;

    let finalOptions: ServiceOptions = {};
    let isTransient = false;
    let deps: Array<Token | any> = [];

    // Check if the argument is a valid options object
    if (
      options &&
      typeof options === 'object' &&
      !(options instanceof Function)
    ) {
      finalOptions = options;
      deps = finalOptions.dependencies || [];
      isTransient = finalOptions.lifecycle === 'transient';
    }

    // Store metadata on the class constructor
    ctor[transient] = isTransient;

    if (finalOptions.token) {
      ctor[tokenName] = finalOptions.token;
    }

    // Store the UNORDERED dependencies list directly.
    if (!Array.isArray(ctor[dependencies])) {
      ctor[dependencies] = [];
    }
    if (deps.length > 0) {
      ctor[dependencies] = deps.map((dep) => ({ token: dep }));
    }

    // Register the service - use the token if provided, otherwise use the class itself
    const serviceToken = finalOptions.token || ctor;
    serviceRegistry().set(serviceToken, ctor);

    // Add instance property after class is fully initialized
    context.addInitializer(function () {
      if (!Object.getOwnPropertyDescriptor(ctor, 'instance')) {
        // Create singleton instance getter
        Object.defineProperty(ctor, 'instance', {
          get: () => {
            if (isTransient) {
              return inject(ctor, true);
            }

            if (!ctor[singleton]) {
              inject(ctor);
            }
            return ctor[singleton];
          },
          configurable: false,
          enumerable: true,
        });
      }
    });
  };
}
