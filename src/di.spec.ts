import { expect, test, describe, it, beforeEach } from 'bun:test';

import { dependencies, PARAM_TOKENS_METADATA } from './types/symbols';
import { Service } from './decorators/Service';
import { Inject } from './decorators/Inject';
import { registerValue } from './functions/registerValue';
import { inject } from './functions/inject';
import { Injectable } from './types/Injectable';

describe('Enhanced Dependency Injection System', () => {
  // Reset registry before each test
  beforeEach(() => {
    //
  });

  describe('Basic DI functionality', () => {
    test('should handle explicit dependencies', () => {
      @Service({ token: 'ServiceA' })
      class ServiceA {
        getValue() {
          return 'A';
        }
      }
      @Service({ token: 'ServiceB' })
      class ServiceB {
        @Inject('ServiceA') private serviceA!: ServiceA;
        constructor() {}
        getValue() {
          return this.serviceA.getValue() + 'B';
        }
      }
      const ctor = ServiceB as unknown as Injectable<ServiceB>;

      console.log('ServiceB dependencies:', ctor[dependencies]);

      const instanceA: ServiceA = inject<ServiceA>('ServiceA');
      expect(instanceA.getValue()).toBe('A');
      const instanceB: ServiceB = inject('ServiceB');
      expect(instanceB.getValue()).toBe('AB');
    });

    it('should handle circular dependencies', () => {
      @Service({ token: 'ServiceA' })
      class ServiceA {
        @Inject('ServiceB', true) private serviceB!: ServiceB;
        getValue() {
          return 'A';
        }
      }
      @Service({ token: 'ServiceB' })
      class ServiceB {
        @Inject('ServiceA') private serviceA!: ServiceA;
        constructor() {}
        getValue() {
          return this.serviceA.getValue() + 'B';
        }
      }
      const ctor = ServiceB as unknown as Injectable<ServiceB>;

      console.log('ServiceB dependencies:', ctor[dependencies]);

      const instanceA: ServiceA = inject<ServiceA>('ServiceA');
      expect(instanceA.getValue()).toBe('A');
      const instanceB: ServiceB = inject('ServiceB');
      expect(instanceB.getValue()).toBe('AB');
    });

    it('should create a single instance', () => {
      @Service({ token: 'TestService' })
      class TestService {
        public value: number = Math.random();
      }

      const instance1: TestService = inject('TestService');
      const instance2: TestService = inject('TestService');

      expect(instance1).toBe(instance2);
      expect(instance1.value).toBe(instance2.value);
    });

    it('should create a new instance for transient services', () => {
      @Service({ lifecycle: 'transient', token: 'TransientService' })
      class TransientService {
        public value: number = Math.random();
      }

      const instance1: TransientService = inject('TransientService');
      const instance2: TransientService = inject('TransientService');

      expect(instance1).not.toBe(instance2);
      expect(instance1.value).not.toBe(instance2.value);
    });
  });

  describe('Value dependencies', () => {
    it('should register and inject value dependencies', () => {
      const CONFIG_TOKEN = 'appConfig';
      const config = { apiUrl: 'https://api.example.com', timeout: 3000 };

      registerValue(CONFIG_TOKEN, config);

      @Service({ token: 'ApiService' })
      class ApiService {
        @Inject(CONFIG_TOKEN) private config: any;
        constructor() {}

        getApiUrl() {
          return this.config.apiUrl;
        }
      }

      const apiService = inject<ApiService>('ApiService');
      expect(apiService.getApiUrl()).toBe('https://api.example.com');

      // Can also get the value directly
      const configValue = inject(CONFIG_TOKEN);
      expect(configValue).toBe(config);
    });

    it('should handle multiple values and mixed dependencies', () => {
      class Helper {
        getValue() {
          return 'helper';
        }
      }
      registerValue('HELPER', Helper);
      registerValue('AGE', 42);
      @Service({ token: 'MixedService' })
      class MixedService {
        @Inject('HELPER') public helper!: Helper;
        @Inject('AGE') public age!: number;
        constructor() {}

        getValues() {
          return {
            helper: this.helper.getValue(),
            age: this.age,
          };
        }
      }

      const instance = inject<MixedService>('MixedService');
      console.log('instance', instance);
      const values = instance.getValues();

      expect(values.helper).toBe('helper');
      expect(values.age).toBe(42);
    });
  });

  describe('Error handling', () => {
    it('should throw error for unregistered tokens', () => {
      expect(() => inject('NonExistentToken')).toThrow(
        /No dependency registered/
      );
    });
  });
});
