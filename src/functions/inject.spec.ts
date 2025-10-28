import { expect, test, describe, beforeEach } from 'bun:test';
import { inject } from './inject';
import { getServiceRegistry, createScope } from './registries';
import { dependencies } from '../types/symbols';
import { resetRegistries } from './resetContainer';

describe('inject function', () => {
  beforeEach(() => {
    resetRegistries();
  });

  test('resolves dependencies from dependencies metadata', () => {
    class Dep {
      getValue() {
        return 'D';
      }
    }

    // register Dep in global registry
    getServiceRegistry().set('Dep', Dep);

    class Consumer {
      private dep: any;
      constructor(dep: any) {
        this.dep = dep;
      }
      getValue() {
        return this.dep.getValue();
      }
    }

    // attach metadata so inject will resolve constructor args
    (Consumer as any)[dependencies] = [{ token: 'Dep' }];
    getServiceRegistry().set('Consumer', Consumer);

    const instance = inject<any>('Consumer');
    expect(instance.getValue()).toBe('D');
  });

  test('throws when dependency token is not registered', () => {
    class ConsumerMissingDep {
      constructor(_missing: any) {}
    }
    (ConsumerMissingDep as any)[dependencies] = [{ token: 'MISSING_DEP' }];
    getServiceRegistry().set('ConsumerMissing', ConsumerMissingDep);

    expect(() => inject('ConsumerMissing')).toThrow(
      /No dependency registered.*/
    );
  });

  test('resolves dependency using dependency scope', () => {
    const SCOPE = 'scope-1';
    createScope(SCOPE);

    class ScopedDep {
      getValue() {
        return 'S';
      }
    }

    // register ScopedDep in scoped registry
    getServiceRegistry(SCOPE).set('ScopedDep', ScopedDep);

    class ConsumerScoped {
      private dep: any;
      constructor(dep: any) {
        this.dep = dep;
      }
      getValue() {
        return this.dep.getValue();
      }
    }

    (ConsumerScoped as any)[dependencies] = [
      { token: 'ScopedDep', scope: SCOPE },
    ];
    getServiceRegistry().set('ConsumerScoped', ConsumerScoped);

    const instance = inject<any>('ConsumerScoped');
    expect(instance.getValue()).toBe('S');
  });
});
