import { ScopeToken } from "./ScopeToken";
import { Token } from "./Token";

/**
 * ServiceOptions interface defines the options for the Service decorator.
 * It includes the token name, dependencies, and lifecycle management.
 */
export interface ServiceOptions {
  token?: string | symbol; // Optional token name
  dependencies?: Array<Token | any>; // Dependencies can be tokens or direct values
  lifecycle?: 'singleton' | 'transient'; // Singleton by default
  scope?: ScopeToken; // Optional scope for the service
}