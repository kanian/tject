# tject — Dependency Injection for TypeScript

## A lightweight TypeScript dependency-injection system with support for:

- singleton and transient lifecycles
- token-based providers (string / symbol / class)
- value and factory providers
- a module system and bootstrap helper

## Core APIs

- `Service` decorator: `src/decorators/Service.ts`
- Field decorator: `Inject` — `src/decorators/Inject.ts`
- Programmatic injection: `inject` — `src/functions/inject.ts`
- Register values: `registerValue` — `src/functions/registerValue.ts`
- Module bootstrap: `bootstrap` — `src/functions/bootstrap.ts`
- Reset container (tests): `resetContainer` — `src/functions/resetContainer.ts`

## Quick install

```bash
bun add @kanian77/tject
```

## Basic usage

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
{ provide: 'MyServiceToken', useClass: MyService }
```

Modules and bootstrap

```ts
const appModule = new Module({
  providers: [
    { provide: 'CONFIG', useValue: { env: 'dev' } },
    { provide: 'MyServiceToken', useClass: MyService },
  ],
});
bootstrap(appModule);
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

## Modules and imports

Modules may import other modules. Importing a module makes its providers available to the importing module (the bootstrap process walks imports and registers providers from imports as well as the root module). Example:

```ts
const moduleA = new Module({ providers: [{ provide: 'A', useClass: ServiceA }] });
const rootModule = new Module({ imports: [{ module: ModuleA }], providers: [{ provide: 'B', useClass: ServiceB }] });
bootstrap(rootModule);
```

Modules are the preferred way to compose large applications and to group related providers and configuration.

## Import bindings (provider mapping)

In addition to importing modules, you can declare `binds` on an import to map providers between the importing module and the imported module. The `ImportOptions` shape looks like this:

```ts
interface ImportOptions {
  module: Module;
  binds?: { to: Token; from: Token }[];
}
```

`binds` declares explicit provider mappings that tell the bootstrap how to satisfy service dependencies automatically. When a bind is present, `bootstrap()` will add the imported provider token to the importing service's dependency list so you typically don't need to add an explicit `@Inject` for that dependency. This makes modules more descriptive and enforcing: a module can declare how imported providers fulfill its local service dependencies. You can still use `@Inject` if you prefer to see injections close to the code using them.

Example (from tests):

```ts
// moduleX provides ServiceX under token 'ServiceX'
const moduleX = new Module({ providers: [{ provide: 'ServiceX', useClass: ServiceX }] });

// moduleY provides ServiceY which depends on ServiceX but is declared under a different token
const moduleY = new Module({
  providers: [{ provide: 'ServiceY', useClass: ServiceY }],
  imports: [{
    module: moduleX,
    binds: [{ to: 'ServiceY', from: 'ServiceX' }]
  }],
});

// When bootstrapping the root module, the bind is processed and
// ServiceY receives ServiceX as a dependency automatically.
bootstrap(new Module({ imports: [{ module: moduleY }] }));

const instanceY = inject('ServiceY');
// instanceY.getValue() can now call into ServiceX because the dependency was added
```
// Look at tests for more examples of import binds with scopes: `src/functions/bootstrap.spec.ts`
## Runtimes and decorator support

The new TypeScript decorator standard (Stage 3) is supported differently by runtimes. Choose the workflow that matches your runtime.

1. Deno — Native Stage 3 support
- Deno executes TypeScript natively and supports Stage 3 decorators.
- How to run:

```bash
deno run --allow-read your-file.ts
```

- tsconfig: Deno is zero-config; omit the old experimental decorator flag (do not set "experimentalDecorators": true).
2. Node.js — Transpile first
- Node's V8 does not yet support Stage 3 decorator syntax. Transpile first with `tsc`, then run the compiled JavaScript.
- How to run:

```bash
# 1) compile
npm run build

# 2) run compiled JS
node dist/your-file.js
```

- tsconfig: Use Stage 3 settings — omit or set `"experimentalDecorators": false` so `tsc` emits Stage 3-compatible transpiled JS.
3. Bun — Two modes (legacy native vs transpiled JS)
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
  1. Transpile first with `tsc` then run compiled tests (or test harness) against `dist/`.
  2. Use Deno for native Stage 3 support if you want to run TypeScript directly.

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
