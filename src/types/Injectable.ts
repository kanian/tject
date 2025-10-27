import { Constructor } from "./Constructor";
import { DependencyDescriptor } from "./DependencyDescriptor";
import { singleton, dependencies, tokenName, transient, injectedParams } from "./symbols";
import { Token } from "./Token";

/**
 * Injectable interface extends the Constructor type and adds metadata properties
 * for dependency injection.
 * It is used to define classes that can be injected as dependencies.
 */
export interface Injectable<T = any> extends Constructor<T> {
  [singleton]?: T;
  [dependencies]?: DependencyDescriptor[];
  [injectedParams]?: Token[];
  [tokenName]?: string | symbol;
  [transient]?: boolean;
}