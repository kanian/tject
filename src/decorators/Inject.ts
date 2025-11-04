import { Token } from '../types/Token';
import { getResolvingMap, getServiceRegistry } from '../functions/registries';
import { Injectable } from '../types/Injectable';
import { inject } from '../functions/inject';
import { ScopeToken } from '../types/ScopeToken';
import { InjectOptions } from '../types/InjectOptions';

/**
 * The token must be registered in the service registry.
 *
 * @param token - The token to lookup in the service registry
 * @param lazy - If true, the dependency is lazily injected on first access
 * @example
 * // Interface-based injection
 * const LOGGER_TOKEN = Symbol('ILogger');
 *
 * @Service({ token: LOGGER_TOKEN })
 * class WinstonLogger implements ILogger { }
 *
 * @Service()
 * class UserService {
 *   @Inject(LOGGER_TOKEN) private logger: ILogger
 *   constructor(
 *   ) {}
 * }
 *
 */
export function Inject(options: InjectOptions) {
  const { token, lazy = false, scope } = options;
  return function <T extends Injectable<any>>(
    target: undefined,
    context: ClassFieldDecoratorContext | ClassAccessorDecoratorContext
  ) {
    context.addInitializer(function (this: unknown) {
      // Look up the service/value from the registry
      const registry = getServiceRegistry(scope);

      if (!registry.has(token)) {
        throw new Error(
          `Token "${String(token)}" not found in service registry. ` +
            `Make sure it's registered in a Module or via @Service decorator before use.`
        );
      }

      if (!lazy) {
        const registeredValue = inject(token, false, scope);

        Object.defineProperty(this, context.name, {
          value: registeredValue,
          writable: false,
          enumerable: true,
          configurable: false,
        });
      } else {
        getResolvingMap().set(token, { lazy: true });
        let _value: any;

        Object.defineProperty(this, context.name, {
          get() {
            if (!_value) {
              _value = inject(token, false, scope);
            }
            return _value;
          },
          set(newValue) {
            _value = newValue;
          },
          enumerable: true,
          configurable: true,
        });

        return undefined;
      }
    });
  };
}
