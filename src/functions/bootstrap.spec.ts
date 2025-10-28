import { expect, test, describe, beforeEach } from 'bun:test';
import { Module } from '../types/Module';
import { bootstrap } from './bootstrap';
import { inject } from './inject';
import { Service } from '../decorators/Service';
import { Inject } from '../decorators/Inject';
import { createScope } from './registries';

describe('Bootstrap Functionality', () => {
  test('should process root module and its imports', () => {
    @Service({ token: 'ServiceA' })
    class ServiceA {
      getValue() {
        return 'A';
      }
    }

    @Service({ token: 'ServiceB' })
    class ServiceB {
      getValue() {
        return 'B';
      }
    }

    const moduleA = new Module({
      providers: [
        {
          provide: 'ServiceA',
          useClass: ServiceA,
        },
      ],
    });

    const rootModule = new Module({
      imports: [{ module: moduleA }],
      providers: [
        {
          provide: 'ServiceB',
          useClass: ServiceB,
        },
      ],
    });

    bootstrap(rootModule);

    const instanceA: ServiceA = inject('ServiceA');
    const instanceB: ServiceB = inject('ServiceB');

    expect(instanceA.getValue()).toBe('A');
    expect(instanceB.getValue()).toBe('B');
  });

  test('should register value providers', () => {
    const CONFIG_TOKEN = 'appConfig';
    const config = { apiUrl: 'https://api.example.com', timeout: 3000 };

    const rootModule = new Module({
      providers: [
        {
          provide: CONFIG_TOKEN,
          useValue: config,
        },
      ],
    });

    bootstrap(rootModule);

    const configValue = inject(CONFIG_TOKEN);
    expect(configValue).toBe(config);
  });

  test('should register factory providers', () => {
    class ClassA {
      getValue() {
        return 'ClassA';
      }
    }
    const factory = () => {
      return new ClassA();
    };
    const rootModule = new Module({
      providers: [
        {
          provide: 'ClassA',
          useFactory: factory,
        },
      ],
    });
    bootstrap(rootModule);
    const instanceA = inject<ClassA>('ClassA');
    expect(instanceA.getValue()).toBe('ClassA');
  });

  test('should register raw class providers', () => {
    @Service()
    class TokenService {
      getValue() {
        return 'TokenService';
      }
    }

    const rootModule = new Module({
      providers: [TokenService],
    });

    bootstrap(rootModule);

    const instance = inject<TokenService>(TokenService);
    expect(instance.getValue()).toBe('TokenService');
  });

  test('should register class providers with tokens', () => {
    const TOKEN = Symbol('TestToken');

    @Service({ token: TOKEN })
    class TokenService {
      getValue() {
        return 'TokenService';
      }
    }

    const rootModule = new Module({
      providers: [
        {
          provide: TOKEN,
          useClass: TokenService,
        },
      ],
    });

    bootstrap(rootModule);

    const instance = inject<TokenService>(TOKEN);
    expect(instance.getValue()).toBe('TokenService');
  });

  test('should handle nested module imports', () => {
    @Service()
    class ServiceC {
      getValue() {
        return 'C';
      }
    }
    const moduleB = new Module({
      providers: [
        {
          provide: 'ServiceC',
          useClass: ServiceC,
        },
      ],
    });

    const moduleA = new Module({
      imports: [{ module: moduleB }],
    });

    const rootModule = new Module({
      imports: [{ module: moduleA }],
    });

    bootstrap(rootModule);

    const instanceC: ServiceC = inject(ServiceC);
    expect(instanceC.getValue()).toBe('C');
  });
  test('should handle import bindings', () => {
    @Service({ token: 'ServiceX' })
    class ServiceX {
      getValue() {
        return 'X';
      }
    }

    @Service({ token: 'ServiceY' })
    class ServiceY {
      constructor(private serviceX: ServiceX) {}
      getValue() {
        return this.serviceX.getValue() + 'Y';
      }
    }

    const moduleX = new Module({
      providers: [
        {
          provide: 'ServiceX',
          useClass: ServiceX,
        },
      ],
    });

    const moduleY = new Module({
      providers: [
        {
          provide: 'ServiceY',
          useClass: ServiceY,
        },
      ],
      imports: [
        {
          module: moduleX,
          binds: [
            {
              to: 'ServiceY',
              from: 'ServiceX',
            },
          ],
        },
      ],
    });
    const rootModule = new Module({
      imports: [{ module: moduleY }],
    });

    bootstrap(rootModule);

    const instanceY: ServiceY = inject('ServiceY');
    expect(instanceY.getValue()).toBe('XY');
  });

  test('should handle import bindings and redundant @Inject', () => {
    @Service({ token: 'ServiceX' })
    class ServiceX {
      getValue() {
        return 'X';
      }
    }

    @Service({ token: 'ServiceY' })
    class ServiceY {
      @Inject('ServiceX') private serviceX!: ServiceX;
      constructor() {}
      getValue() {
        return this.serviceX.getValue() + 'Y';
      }
    }

    const moduleX = new Module({
      providers: [
        {
          provide: 'ServiceX',
          useClass: ServiceX,
        },
      ],
    });

    const moduleY = new Module({
      providers: [
        {
          provide: 'ServiceY',
          useClass: ServiceY,
        },
      ],
      imports: [
        {
          module: moduleX,
          binds: [
            {
              to: 'ServiceY',
              from: 'ServiceX',
            },
          ],
        },
      ],
    });
    const rootModule = new Module({
      imports: [{ module: moduleY }],
    });

    bootstrap(rootModule);

    const instanceY: ServiceY = inject('ServiceY');
    expect(instanceY.getValue()).toBe('XY');
  });
  test('should work with scoped registries', () => {
    const SCOPE_X = 'scope-x';
    createScope(SCOPE_X);
    @Service({ token: 'ServiceX', scope: SCOPE_X })
    class ServiceX {
      getValue() {
        return 'X';
      }
    }

    const SCOPE_Y = 'scope-y';
    createScope(SCOPE_Y);
    @Service({ token: 'ServiceY', scope: SCOPE_Y })
    class ServiceY {

      constructor(private serviceX: ServiceX) {}
      getValue() {
        return this.serviceX.getValue() + 'Y';
      }
    }

    const moduleX = new Module({
      providers: [
        {
          provide: 'ServiceX',
          useClass: ServiceX,
        },
      ],
      scope: SCOPE_X,
    });

    const moduleY = new Module({
      providers: [
        {
          provide: 'ServiceY',
          useClass: ServiceY,
        },
      ],
      imports: [
        {
          module: moduleX,
          binds: [
            {
              to: 'ServiceY',
              from: 'ServiceX',
              inScope: SCOPE_X
            },
          ],
        },
      ],
      scope: SCOPE_Y
    });
    const rootModule = new Module({
      imports: [{ module: moduleY }],
    });

    bootstrap(rootModule);

    const instanceY: ServiceY = inject('ServiceY');
    expect(instanceY.getValue()).toBe('XY');
  });
});
