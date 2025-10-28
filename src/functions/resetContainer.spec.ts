import { expect, test, describe, beforeEach, it, afterEach } from 'bun:test';
import { resetRegistries } from './resetContainer';
import { Service } from '../decorators/Service';
import { inject } from './inject';
import { registerValue } from './registerValue';
import { createScope, getServiceRegistry } from './registries';

describe('resetContainer', () => {
  // Always reset after each test to avoid interference between tests
  afterEach(() => {
    resetRegistries();
  });

  it('should clear all transient instances', () => {
    @Service({ lifecycle: 'transient', token: 'TransientService' })
    class TransientService {
      public value: number = Math.random();
    }

    // Create a few instances to ensure they're registered
    // inject('TransientService');

    // Reset the container
    resetRegistries();

    expect(() => inject('TransientService')).toThrow(
      /No dependency registered/
    );
    // This here is to show you that resetContainer is quirky
    expect(getServiceRegistry().size).toBe(0);
    // This here is to show you that you must use registerValue to get the same behavior
    // as before resetting the container
    registerValue('TransientService', TransientService);
    inject('TransientService');
    expect(getServiceRegistry().size).toBe(1);
  });

  it('should clear all singleton instances', () => {
    @Service({ token: 'SingletonService' })
    class SingletonService {
      public value: number = Math.random();
    }

    @Service({ token: 'AnotherSingletonService' })
    class AnotherSingletonService {
      public value: number = Math.random();
    }
    // Create initial instance
    let instance1: SingletonService | undefined = undefined;
    let anotherInstance1: AnotherSingletonService | undefined = undefined;
    expect(() => {
      instance1 = inject('SingletonService');
      anotherInstance1 = inject('AnotherSingletonService');
    }).not.toThrow();
    expect(instance1).toBeDefined();
    expect(anotherInstance1).toBeDefined();
    // Reset the container
    resetRegistries();
    expect(getServiceRegistry().size).toBe(0);
    // Get a new instance - it should have a different value
    registerValue('SingletonService', SingletonService);
    const instance2: SingletonService = inject('SingletonService');
    expect(instance2).not.toBe(instance1);
    expect(getServiceRegistry().size).toBe(1);
  });

  it('should clear registered values', () => {
    const CONFIG_TOKEN = 'appConfig';
    const config = { apiUrl: 'https://api.example.com' };

    registerValue(CONFIG_TOKEN, config);

    // Verify the value is registered
    const configValue = inject(CONFIG_TOKEN);
    expect(configValue).toBe(config);

    // Reset the container
    resetRegistries();

    // The value should no longer be registered
    expect(() => inject(CONFIG_TOKEN)).toThrow(/No dependency registered/);
  });

  it('should allow re-registration of services after reset', () => {
    const SERVICE_TOKEN = 'serviceToken';

    @Service({ token: SERVICE_TOKEN })
    class OriginalService {
      getValue() {
        return 'original';
      }
    }

    const original = inject<OriginalService>(SERVICE_TOKEN);
    expect(original.getValue()).toBe('original');

    // Reset the container
    resetRegistries();
    expect(getServiceRegistry().size).toBe(0);

    // Register a new service with the same token
    @Service({ token: SERVICE_TOKEN })
    class NewService {
      getValue() {
        return 'new';
      }
    }

    const newInstance = inject<NewService>(SERVICE_TOKEN);
    expect(newInstance.getValue()).toBe('new');
    expect(getServiceRegistry().size).toBe(1);
  });
  it('should work with scoped registries', () => {
    const SERVICE_TOKEN = 'serviceToken';
    const TEST_SCOPE = 'test-scope';
    createScope(TEST_SCOPE);

    @Service({ token: SERVICE_TOKEN, scope: TEST_SCOPE })
    class OriginalService {
      getValue() {
        return 'original';
      }
    }

    const original = inject<OriginalService>(
      SERVICE_TOKEN,
      false,
      TEST_SCOPE
    );
    expect(original.getValue()).toBe('original');

    // Reset the container
    resetRegistries();
    expect(getServiceRegistry(TEST_SCOPE).size).toBe(0);

    // Register a new service with the same token
    @Service({ token: SERVICE_TOKEN, scope: TEST_SCOPE })
    class NewService {
      getValue() {
        return 'new';
      }
    }

    const newInstance = inject<NewService>(SERVICE_TOKEN, false, TEST_SCOPE);
    expect(newInstance.getValue()).toBe('new');
    expect(getServiceRegistry(TEST_SCOPE).size).toBe(1);
  });
});
