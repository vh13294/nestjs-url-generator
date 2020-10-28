import { ModuleMetadata, Type } from "@nestjs/common";

export interface SignedUrlModuleOptions {
    secret: string;
    appUrl: string;
}

export interface SignedUrlAsyncModuleOptions extends Pick<ModuleMetadata, 'imports'> {
    inject?: any[];
    useClass?: Type<SignedUrlModuleOptionsFactory>;
    useExisting?: Type<SignedUrlModuleOptionsFactory>;
    useFactory?: (...args: any[]) => Promise<SignedUrlModuleOptions> | SignedUrlModuleOptions;
}

export interface SignedUrlModuleOptionsFactory {
    createSignedUrlOptions(): Promise<SignedUrlModuleOptions> | SignedUrlModuleOptions;
}