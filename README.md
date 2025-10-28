# Dependency Injection System

This project is a TypeScript-based Dependency Injection (DI) system designed to facilitate the management of dependencies in a modular and scalable way. It supports features such as singleton and transient lifecycles, and custom token names for services.

## Features

- **Service Registration**: Register classes or values as services using decorators or direct registration.
- **Autowiring**: Automatically resolve and inject dependencies based on constructor parameters.
- **Singleton and Transient Lifecycles**: Support for singleton (single instance) and transient (new instance per request) service lifecycles.
- **Custom Tokens**: Use strings, symbols, or classes as unique identifiers for services.
- **Module System**: Organize services into modules for better structure and reusability.
- **Value and Factory Providers**: Register static values or use factory functions to create service instances.

## Installation

To install the dependencies, run:

```bash
npm install
```

## Usage

### Registering a Service

Use the `@Service` decorator to register a class as a service:

```typescript
@Service()
class MyService {
  getValue() {
    return 'Hello, World!';
  }
}
```

### Injecting Dependencies

Use the `@Inject` decorator to inject dependencies into a class using tokens:

````typescript
const MY_SERVICE_TOKEN = Symbol('MyServiceToken');

@Service({ token: MY_SERVICE_TOKEN })
class MyService {
  getValue() {
    return 'Hello, World!';
  }
}

@Service()
class ConsumerService {
  constructor(@Inject(MY_SERVICE_TOKEN) private myService: MyService) {}

  getValue() {
    # typejection — Dependency Injection for TypeScript

    A lightweight TypeScript dependency-injection system with support for:

    - singleton and transient lifecycles
    - token-based providers (string / symbol / class)
    - value and factory providers
    - a module system and bootstrap helper

    Core APIs
    - `Service` decorator: `src/decorators/Service.ts`
    - Field decorator: `Inject` — `src/decorators/Inject.ts`
    - Programmatic injection: `inject` — `src/functions/inject.ts`
    - Register values: `registerValue` — `src/functions/registerValue.ts`
    - Module bootstrap: `bootstrap` — `src/functions/bootstrap.ts`
    - Reset container (tests): `resetContainer` — `src/functions/resetContainer.ts`

    Quick install

    ```bash
    npm install
    ```

    Basic usage

    Register a class as a service with the decorator:

    ```ts
    @Service()
    class MyService {
      getValue() { return 'hello'; }
    }
    ```

    Inject a dependency into a field:

    ```ts
    const LOGGER = Symbol('Logger');

    @Service({ token: LOGGER })
    class Logger { log(msg: string) { console.log(msg); } }

    @Service()
    class Consumer {
      @Inject(LOGGER) private logger!: Logger;
      doWork() { this.logger.log('work'); }
    }
    ```

    Programmatic injection:

    ```ts
    const svc = inject<MyService>(MyService);
    ```

    Register values or factories (via Module providers):

    ```ts
    // value provider
    { provide: 'CONFIG', useValue: { apiUrl: 'https://api' } }

    // factory provider
    { provide: 'ID', useFactory: () => crypto.randomUUID() }

    // class provider (raw class)
    MyService
    ```

    Modules and bootstrap

    ```ts
    const appModule = new Module({
      providers: [
        # typejection — Dependency Injection for TypeScript

        A lightweight TypeScript dependency-injection system with support for:

        - singleton and transient lifecycles
        - token-based providers (string / symbol / class)
        - value and factory providers
        - a module system and bootstrap helper

        Core APIs
        - `Service` decorator: `src/decorators/Service.ts`
        - Field decorator: `Inject` — `src/decorators/Inject.ts`
        - Programmatic injection: `inject` — `src/functions/inject.ts`
        - Register values: `registerValue` — `src/functions/registerValue.ts`
        - Module bootstrap: `bootstrap` — `src/functions/bootstrap.ts`
        - Reset container (tests): `resetContainer` — `src/functions/resetContainer.ts`

        Quick install

        ```bash
        npm install
        ```

        Basic usage

        Register a class as a service with the decorator:

        ```ts
        @Service()
        class MyService {
          getValue() { return 'hello'; }
        }
        ```

        Inject a dependency into a field:

        ```ts
        const LOGGER = Symbol('Logger');

        @Service({ token: LOGGER })
        class Logger { log(msg: string) { console.log(msg); } }

        @Service()
        class Consumer {
          @Inject(LOGGER) private logger!: Logger;
          doWork() { this.logger.log('work'); }
        }
        ```

        Programmatic injection:

        ```ts
        const svc = inject<MyService>(MyService);
        ```

        Module providers — the three supported forms

        When configuring a `Module`, a provider can be declared in one of three ways. The module system supports:

        - useClass — register a class to be instantiated when the token is requested
          ```ts
          { provide: 'MyToken', useClass: MyService }
          ```

        - useValue — register a static value (useful for configuration)
          ```ts
          { provide: 'CONFIG', useValue: { apiUrl: 'https://api' } }
          ```

        - useFactory — register a factory function that returns the value/instance
          ```ts
          { provide: 'ID', useFactory: () => Math.random().toString(36).slice(2) }
          ```

        You may also pass a raw class directly in `providers` as a shorthand (the class will be registered by its constructor token):

        ```ts
        providers: [ MyService ]
        ```

        Modules and imports

        Modules may import other modules. Importing a module makes its providers available to the importing module (the bootstrap process walks imports and registers providers from imports as well as the root module). Example:

        ```ts
        const moduleA = new Module({ providers: [{ provide: 'A', useClass: ServiceA }] });
        const rootModule = new Module({ imports: [moduleA], providers: [{ provide: 'B', useClass: ServiceB }] });
        bootstrap(rootModule);
        ```

        Modules are the preferred way to compose large applications and to group related providers and configuration.

        Modules and bootstrap (short example)

        ```ts
        const appModule = new Module({
          providers: [
            { provide: 'CONFIG', useValue: { env: 'dev' } },
            MyService,
          ],
        });
        bootstrap(appModule);
        ```

        Runtimes and decorator support

        The new TypeScript decorator standard (Stage 3) is supported differently by runtimes. Choose the workflow that matches your runtime.

        1) Deno — Native Stage 3 support

        - Deno executes TypeScript natively and supports Stage 3 decorators.
        - How to run:

        ```bash
        deno run --allow-read your-file.ts
        ```

        - tsconfig: Deno is zero-config; omit the old experimental decorator flag (do not set "experimentalDecorators": true).

        2) Node.js — Transpile first

        - Node's V8 does not yet support Stage 3 decorator syntax. Transpile first with `tsc`, then run the compiled JavaScript.
        - How to run:

        ```bash
        # 1) compile
        npm run build

        # 2) run compiled JS
        node dist/your-file.js
        ```

        - tsconfig: Use Stage 3 settings — omit or set `"experimentalDecorators": false` so `tsc` emits Stage 3-compatible transpiled JS.

        3) Bun — Two modes (legacy native vs transpiled JS)

        - Bun's native TypeScript transpiler supports legacy decorators only (the older emit).
        - To use Stage 3 decorators (this project): transpile with `tsc` and run the compiled JS with Bun or Node.

        ```bash
        npm run build
        bun run dist/your-file.js
        ```

        - Summary:
          - Bun native (`bun run file.ts`): legacy decorators only (requires `"experimentalDecorators": true` in tsconfig).
          - Bun running compiled JS: works with Stage 3 (transpile with `tsc` which uses `"experimentalDecorators": false`).

        Recommended tsconfig for Stage 3 (this repository)

        - See `tsconfig.json`. Important bits:
          - `"experimentalDecorators": false` (or omit) to use the new Stage 3 decorators.
          - Compile to a target like `ES2015` so `tsc` emits plain JS that Node/Bun can run.

        Running tests (notes)

        - Tests in this repo are TypeScript test files. Bun's native test runner for `.ts` files will use Bun's transpiler and therefore may fail when Stage 3 decorators are present.
        - Recommended approaches:
          1) Transpile first with `tsc` then run compiled tests (or test harness) against `dist/`.
          2) Use Deno for native Stage 3 support if you want to run TypeScript directly.

        Helpful files
        - Main exports: `src/index.ts`
        - Decorators: `src/decorators/Service.ts`, `src/decorators/Inject.ts`
        - Injector: `src/functions/inject.ts`
        - Bootstrap: `src/functions/bootstrap.ts`
        - Registry / reset: `src/functions/serviceRegistry.ts`, `src/functions/resetContainer.ts`
        - Config: `package.json`, `tsconfig.json`

        Contributing

        - Open a PR. Run `npm run build` and verify behavior on your target runtime.

        License
        - MIT
````
