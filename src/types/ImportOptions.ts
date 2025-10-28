import { Module } from './Module';
import { Token } from './Token';

export interface ImportOptions {
  /**
   * The module to import.
   */
  module: Module;
  binds?: [{ importingProvider: Token; importedProvider: Token }];
}
