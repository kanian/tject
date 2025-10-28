import { singleton, transient } from '../types/symbols';
import {
  destroyRegistries,
  getResolvingMap,
  getServiceRegistry,
} from './registries';

/**
 * Resets the dependency injection container.
 * This clears all singleton and transient instances and resets the container to its initial state.
 * Useful for testing and for scenarios where you need to reinitialize the container.
 * NB: This function should be used with caution, as it will remove all registered services and instances.
 * It is primarily intended for testing purposes.
 * You will need to use registerValue if you are using custom tokens in order to get the same behavior as
 * before resetting the container.
 */
export function resetRegistries(): void {
  destroyRegistries();
}
