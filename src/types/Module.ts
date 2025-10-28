import { ImportOptions } from './ImportOptions';
import { ModuleOptions } from './ModuleOptions';
import { ProviderOptions } from './ProviderOptions';

export class Module {
  imports: ImportOptions[];
  providers: ProviderOptions[];
  constructor(options: ModuleOptions) {
    this.imports = options.imports || [];
    this.providers = options.providers || [];
  }
}
