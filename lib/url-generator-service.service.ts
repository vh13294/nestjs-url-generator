import { ApplicationConfig } from '@nestjs/core';
import { Controller } from '@nestjs/common/interfaces/controllers/controller.interface';
import { Inject, Injectable, Logger, ForbiddenException, ConflictException } from '@nestjs/common';

import { UrlGeneratorModuleOptions } from './url-generator-options.interface';
import { RESERVED_QUERY_PARAM_NAMES, URL_GENERATOR_MODULE_OPTIONS } from './url-generator.constants';

import {
    generateHmac,
    getControllerMethodRoute,
    signatureHasNotExpired,
    isSignatureEqual,
    checkIfQueryHasReservedKeys,
    stringifyQueryParams,
    ControllerMethod,
    generateUrl,
} from './helpers';

@Injectable()
export class UrlGeneratorService {

    constructor(
        @Inject(URL_GENERATOR_MODULE_OPTIONS)
        private readonly urlGeneratorModuleOptions: UrlGeneratorModuleOptions,
        private readonly applicationConfig: ApplicationConfig,
    ) {
        if (this.urlGeneratorModuleOptions.secret && (this.urlGeneratorModuleOptions.secret.length < 32)) {
            Logger.warn('[urlGeneratorModuleOptions] A min key length of 256-bit or 32-characters is recommended')
        }

        if (!this.urlGeneratorModuleOptions.appUrl) {
            throw new Error('The app url must not be empty');
        }
    }

    public generateUrlFromController(
        controller: Controller,
        controllerMethod: ControllerMethod,
        query: any = {},
        params: any = {},
    ): string {
        const controllerMethodFullRoute = getControllerMethodRoute(controller, controllerMethod)

        return this.generateUrlFromPath(
            controllerMethodFullRoute,
            query,
            params
        )
    }

    public generateUrlFromPath(relativePath: string, query: any = {}, params: any = {}): string {
        return generateUrl(
            this.urlGeneratorModuleOptions.appUrl,
            this.applicationConfig.getGlobalPrefix(),
            relativePath,
            query,
            params
        )
    }

    public signedControllerUrl(
        controller: Controller,
        controllerMethod: ControllerMethod,
        expirationDate: Date,
        query: any = {},
        params: any = {},
    ): string {
        const controllerMethodFullRoute = getControllerMethodRoute(controller, controllerMethod)

        return this.signedUrl(
            controllerMethodFullRoute,
            expirationDate,
            query,
            params
        )
    }

    public signedUrl(
        relativePath: string,
        expirationDate: Date,
        query: any = {},
        params: any = {}
    ): string {
        if (checkIfQueryHasReservedKeys(query)) {
            throw new ConflictException(
                'Your target URL has a query param that is used for signing a route.' +
                ` eg. [${RESERVED_QUERY_PARAM_NAMES.join(', ')}]`
            )
        }

        query.expirationDate = expirationDate.toISOString()
        const urlWithoutHash = generateUrl(
            this.urlGeneratorModuleOptions.appUrl,
            this.applicationConfig.getGlobalPrefix(),
            relativePath,
            query,
            params,
        )

        query.signed = generateHmac(urlWithoutHash, this.urlGeneratorModuleOptions.secret)
        const urlWithHash = generateUrl(
            this.urlGeneratorModuleOptions.appUrl,
            this.applicationConfig.getGlobalPrefix(),
            relativePath,
            query,
            params,
        )

        return urlWithHash
    }

    public isSignatureValid(host: string, routePath: string, query: any = {}): boolean {
        const { signed, ...restQuery } = query;
        const fullUrl = `${host}${routePath}?${stringifyQueryParams(restQuery)}`

        const hmac = generateHmac(fullUrl, this.urlGeneratorModuleOptions.secret)
        const expiryDate = new Date(restQuery.expirationDate)

        if (!signed || !hmac || (signed.length != hmac.length)) {
            throw new ForbiddenException('Invalid Url')
        } else {
            return isSignatureEqual(signed, hmac) && signatureHasNotExpired(expiryDate);
        }
    }
}
