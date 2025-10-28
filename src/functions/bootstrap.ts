import { DependencyDescriptor } from '../types/DependencyDescriptor';
import { ImportOptions } from '../types/ImportOptions';
import { Module } from '../types/Module';
import { ProviderOptions } from '../types/ProviderOptions';
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
      module.imports.forEach((moduleImportDescription: ImportOptions) => {
        module.providers.forEach((provider: ProviderOptions) => {
          // Ensure dependencies are registered
          if (
            typeof provider === 'object' &&
            moduleImportDescription.binds &&
            Array.isArray(moduleImportDescription.binds)
          ) {
            moduleImportDescription.binds.forEach(
              ({ to: importingProvider, from: importedProvider, inScope }) => {
                if (importingProvider === provider.provide) {
                  addDependencyIfMissing(
                    provider.provide,
                    importedProvider,
                    module.scope,
                    inScope
                  );
                }
              }
            );
          }
        });
        processModule(moduleImportDescription.module);
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
};

/**
 * Adds a dependency to a service if it is described in binds but not already present in service's declared dependencies.
 * @param tokenToCheck The token on which to check that the dependency is present
 * @param tokenToAdd The token whose dependency should be added if missing
 * @param tokenToCheckScope The scope of the token to check
 * @param tokenToAddScope The scope of the token to add
 */
const addDependencyIfMissing = (
  tokenToCheck: Token,
  tokenToAdd: Token,
  tokenToCheckScope?: ScopeToken,
  tokenToAddScope?: ScopeToken
) => {
  const registered = getServiceRegistry(tokenToCheckScope).get(tokenToCheck);
  if (registered && typeof registered === 'function') {
    const deps: Array<DependencyDescriptor> = registered[dependencies] || [];

    const depTokens = deps.map((dep: DependencyDescriptor) => dep.token);
    if (!depTokens.includes(tokenToAdd)) {
      deps.push({ token: tokenToAdd, scope: tokenToAddScope });
      registered[dependencies] = deps;
    }
  }
};
