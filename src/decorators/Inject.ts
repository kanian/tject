import { Token } from "../types/Token";
import { serviceRegistry } from "../functions/serviceRegistry";
import { Injectable } from "../types/Injectable";
import { dependencies } from "../types/symbols";
import { inject } from "../functions/inject";

/**
 * Modern TS5+ Inject decorator that directly replaces constructor parameters
 * with instances from the service registry.
 *
 * The token must be registered in the service registry before the class is instantiated.
 *
 * @param token - The token to lookup in the service registry
 *
 * @example
 * // Interface-based injection
 * const LOGGER_TOKEN = Symbol('ILogger');
 *
 * @Service({ token: LOGGER_TOKEN })
 * class WinstonLogger implements ILogger { }
 *
 * @Service()
 * class UserService {
 *   constructor(
 *     @Inject(LOGGER_TOKEN) private logger: ILogger
 *   ) {}
 * }
 *
 * @example
 * // String tokens for configuration
 * @Service()
 * class DatabaseService {
 *   constructor(
 *     @Inject('DB_CONFIG') private config: DbConfig,
 *     @Inject('LOGGER') private logger: ILogger
 *   ) {}
 * }
 */
export function Inject(token: Token) {
  return function <T extends Injectable<any>>(
    target: undefined,
    context: ClassFieldDecoratorContext | ClassAccessorDecoratorContext
  ) {
    context.addInitializer(function (this: unknown) {
      let constructorReference: Function;
      // Look up the service/value from the registry
      const registry = serviceRegistry();

      if (!registry.has(token)) {
        throw new Error(
          `Token "${String(token)}" not found in service registry. ` +
          `Make sure it's registered in a Module or via @Service decorator before use.`
        );
      }

      // Get the registered value for the token
      const registeredValue = inject(token);

      // constructorReference = (this as unknown as T).constructor;
      // const ctor = constructorReference as any;
      // if (!Array.isArray(ctor[dependencies])) {
      //   ctor[dependencies] = [];
      // }
      // ctor[dependencies].push(token)



      // Replace the parameter with the resolved instance
      // This happens during class construction
      Object.defineProperty(this, context.name, {
        value: registeredValue,
        writable: false,
        enumerable: true,
        configurable: false
      });
    });
  };
}