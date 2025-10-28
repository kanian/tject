import { ImportOptions } from './ImportOptions';
import { ModuleOptions } from './ModuleOptions';
import { ProviderOptions } from './ProviderOptions';
import { ScopeToken } from './ScopeToken';

export class Module {
  imports: ImportOptions[];
  providers: ProviderOptions[];
  scope?: ScopeToken
  constructor(options: ModuleOptions) {
    this.imports = options.imports || [];
    this.providers = options.providers || [];
    this.scope = options.scope;
  }
}
