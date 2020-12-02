import { ModuleMetadata, Type } from '@nestjs/common';

export interface UrlGeneratorModuleOptions {
  secret?: string;
  appUrl: string;
}

export interface UrlGeneratorAsyncModuleOptions
  extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  useClass?: Type<UrlGeneratorModuleOptionsFactory>;
  useExisting?: Type<UrlGeneratorModuleOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<UrlGeneratorModuleOptions> | UrlGeneratorModuleOptions;
}

export interface UrlGeneratorModuleOptionsFactory {
  createUrlGeneratorOptions():
    | Promise<UrlGeneratorModuleOptions>
    | UrlGeneratorModuleOptions;
}
