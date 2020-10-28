import { DynamicModule, Module, Provider, ValueProvider } from '@nestjs/common';
import {
    SignedUrlAsyncModuleOptions,
    SignedUrlModuleOptions,
    SignedUrlModuleOptionsFactory
} from './signed-url-options.interface';
import { SignedUrlService } from './signed-url-service.service';
import { SIGNED_URL_MODULE_OPTIONS } from './signed-url.constants';

@Module({})
export class SignedUrlModule {
    public static forRoot(options: SignedUrlModuleOptions): DynamicModule {

        const signedUrlOptionsProvider: ValueProvider<SignedUrlModuleOptions> = {
            provide: SIGNED_URL_MODULE_OPTIONS,
            useValue: options,
        };

        return {
            module: SignedUrlModule,
            providers: [
                signedUrlOptionsProvider,
                SignedUrlService,
            ],
            exports: [
                SignedUrlService,
            ],
        };
    }

    public static forRootAsync(options: SignedUrlAsyncModuleOptions): DynamicModule {
        const providers: Provider[] = this.createAsyncProviders(options);

        return {
            module: SignedUrlModule,
            providers: [
                ...providers,
                SignedUrlService,
            ],
            imports: options.imports,
            exports: [
                SignedUrlService,
            ],
        };
    }

    private static createAsyncProviders(options: SignedUrlAsyncModuleOptions): Provider[] {
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
        options: SignedUrlAsyncModuleOptions,
    ): Provider {
        if (options.useFactory) {
            return {
                name: SIGNED_URL_MODULE_OPTIONS,
                provide: SIGNED_URL_MODULE_OPTIONS,
                useFactory: options.useFactory,
                inject: options.inject || [],
            };
        }

        return {
            name: SIGNED_URL_MODULE_OPTIONS,
            provide: SIGNED_URL_MODULE_OPTIONS,
            useFactory: async (optionsFactory: SignedUrlModuleOptionsFactory) => {
                return optionsFactory.createSignedUrlOptions();
            },
            inject: [options.useExisting! || options.useClass!],
        };
    }
}
