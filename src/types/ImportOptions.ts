import { ImportBindOptions } from './ImportBindOptions';
import { Module } from './Module';
import { ScopeToken } from './ScopeToken';
import { Token } from './Token';

export interface ImportOptions {
  /**
   * The module to import.
   */
  module: Module;
  binds?: Array<ImportBindOptions>;
}
