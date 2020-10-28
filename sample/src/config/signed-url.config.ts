import { SignedUrlModuleOptions } from 'nestjs-url-generator';

export function signedUrlModuleConfig(): SignedUrlModuleOptions {
    return {
        secret: process.env.APP_KEY,
        appUrl: process.env.APP_URL,
    }
};
