import {
  DynamicModule,
  Global,
  Module,
  Provider,
  ValueProvider,
} from '@nestjs/common';
import {
  UrlGeneratorAsyncModuleOptions,
  UrlGeneratorModuleOptions,
  UrlGeneratorModuleOptionsFactory,
} from './url-generator-options.interface';
import { UrlGeneratorService } from './url-generator.service';
import { URL_GENERATOR_MODULE_OPTIONS } from './url-generator.constants';

@Global()
@Module({})
export class UrlGeneratorModule {
  public static forRoot(options: UrlGeneratorModuleOptions): DynamicModule {
    const urlGeneratorOptionsProvider: ValueProvider<UrlGeneratorModuleOptions> = {
      provide: URL_GENERATOR_MODULE_OPTIONS,
      useValue: options,
    };

    return {
      module: UrlGeneratorModule,
      providers: [urlGeneratorOptionsProvider, UrlGeneratorService],
      exports: [UrlGeneratorService],
    };
  }

  public static forRootAsync(
    options: UrlGeneratorAsyncModuleOptions,
  ): DynamicModule {
    const providers: Provider[] = this.createAsyncProviders(options);

    return {
      module: UrlGeneratorModule,
      providers: [...providers, UrlGeneratorService],
      imports: options.imports,
      exports: [UrlGeneratorService],
    };
  }

  private static createAsyncProviders(
    options: UrlGeneratorAsyncModuleOptions,
  ): Provider[] {
    const providers: Provider[] = [this.createAsyncOptionsProvider(options)];

    if (options.useClass) {
      providers.push({
        provide: options.useClass,
        useClass: options.useClass,
      });
    }

    return providers;
  }

  private static createAsyncOptionsProvider(
    options: UrlGeneratorAsyncModuleOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        name: URL_GENERATOR_MODULE_OPTIONS,
        provide: URL_GENERATOR_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    return {
      name: URL_GENERATOR_MODULE_OPTIONS,
      provide: URL_GENERATOR_MODULE_OPTIONS,
      useFactory: async (optionsFactory: UrlGeneratorModuleOptionsFactory) => {
        return optionsFactory.createUrlGeneratorOptions();
      },
      inject: [options.useExisting! || options.useClass!],
    };
  }
}
