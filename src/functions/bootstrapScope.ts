import { ImportOptions } from '../types/ImportOptions';
import { Module } from '../types/Module';
import { ScopeToken } from '../types/ScopeToken';
import { dependencies, tokenName } from '../types/symbols';
import { Token } from '../types/Token';
import { getTokenName } from './getTokenName';
import { registerValue } from './registerValue';
import { getServiceRegistry } from './registries';

export const bootstrap = (scopedModule: Module) => {
  // Process the root module and all its imports recursively
  const scope = scopedModule.scope;
  const scopedRegistry = getServiceRegistry(scope);
  const processedModules = new Set();
  const processModule = (module: Module) => {
    if (processedModules.has(module)) return;
    processedModules.add(module);

    // Process imported modules first
    if (module.imports && Array.isArray(module.imports)) {
      module.imports.forEach((importedModule: ImportOptions) => {
        module.providers.forEach((provider: any) => {
          // Ensure dependencies are registered
          if (importedModule.binds) {
            importedModule.binds.forEach(
              ({ to: importingProvider, from: importedProvider }) => {
                if (importingProvider === provider.provide) {
                  addDependencyIfMissing(provider.provide, importedProvider, scope);
                }
              }
            );
          }
        });
        processModule(importedModule.module);
      });
    }

    // Register providers
    if (module.providers && Array.isArray(module.providers)) {
      module.providers.forEach((provider) => {
        // Provider might be a class or an object with provide/useClass properties
        if (typeof provider === 'function') {
          // It's a class
          if (!scopedRegistry.has(getTokenName(provider))) {
            scopedRegistry.set(getTokenName(provider), provider);
          }
        } else if (provider && typeof provider === 'object') {
          if (provider.provide && provider.useValue) {
            // It's a value provider
            registerValue(provider.provide, provider.useValue, false, scope);
          } else if (provider.provide && provider.useClass) {
            // It's a class provider with a token
            const ctor = provider.useClass;
            ctor[tokenName] = provider.provide;
            scopedRegistry.set(provider.provide, ctor);
          } else if (provider.provide && provider.useFactory) {
            // It's a factory provider
            const factory = provider.useFactory;
            const value = factory();
            registerValue(provider.provide, value, false, scope);
          }
        }
      });
    }
  };

  // Start processing from the root module
  processModule(scopedModule);
}

const addDependencyIfMissing = (tokenToCheck: Token, tokenToAdd: Token, scope?: ScopeToken) => {
  const registered = getServiceRegistry(scope).get(tokenToCheck);
  if (registered && typeof registered === 'function') {
    const deps = registered[dependencies] || [];
    const depTokens = deps.map((dep: any) => dep.token);
    if (!depTokens.includes(tokenToAdd)) {
      deps.push({ token: tokenToAdd });
      registered[dependencies] = deps;
    }
  }
};
