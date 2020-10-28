import { ApplicationConfig } from '@nestjs/core';
import { Controller } from '@nestjs/common/interfaces/controllers/controller.interface';
import { Inject, Injectable, Logger, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';

import { SignedUrlModuleOptions } from './signed-url-options.interface';
import { RESERVED_QUERY_PARAM_NAMES, SIGNED_URL_MODULE_OPTIONS } from './signed-url.constants';

import {
    appendQueryParams,
    generateHmac,
    getControllerMethodRoute,
    signatureHasNotExpired,
    isSignatureEqual,
    joinRoutes,
    checkIfQueryHasReservedKeys,
    stringifyQueryParams,
    ControllerMethod,
    isParamsNameInURL,
    replaceParamsString
} from './helpers';

@Injectable()
export class SignedUrlService {

    constructor(
        @Inject(SIGNED_URL_MODULE_OPTIONS)
        private readonly signedUrlModuleOptions: SignedUrlModuleOptions,
        private readonly applicationConfig: ApplicationConfig,
    ) {
        if (!this.signedUrlModuleOptions.secret) {
            throw new Error('The secret key must not be empty');
        } else if (this.signedUrlModuleOptions.secret.length < 32) {
            Logger.warn('[signedUrlModuleOptions] A min key length of 256-bit or 32-characters is recommended')
        }

        if (!this.signedUrlModuleOptions.appUrl) {
            throw new Error('The app url must not be empty');
        }
    }

    public signedControllerRoute(
        controller: Controller,
        controllerMethod: ControllerMethod,
        expirationDate: Date,
        query: any = {},
        params: any = {},
    ): string {
        const controllerMethodFullRoute = getControllerMethodRoute(controller, controllerMethod)

        return this.signedRelativePathUrl(
            controllerMethodFullRoute,
            expirationDate,
            query,
            params
        )
    }

    public signedRelativePathUrl(
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

        if (params) {
            if (isParamsNameInURL(relativePath, params)) {
                relativePath = replaceParamsString(relativePath, params)
            } else {
                throw new BadRequestException('One of the params name does not exist in target URL')
            }
        }

        const prefix = this.applicationConfig.getGlobalPrefix()
        query.expirationDate = expirationDate.toISOString()

        const generateURL = () => appendQueryParams(
            joinRoutes(
                this.signedUrlModuleOptions.appUrl,
                prefix,
                relativePath,
            ),
            stringifyQueryParams(query)
        )

        const urlWithoutHash = generateURL()

        const hmac = generateHmac(urlWithoutHash, this.signedUrlModuleOptions.secret)
        query.signed = hmac

        const urlWithHash = generateURL()

        return urlWithHash
    }

    public isSignatureValid(host: string, routePath: string, query: any = {}): boolean {
        const { signed, ...restQuery } = query;
        const fullUrl = `${host}${routePath}?${stringifyQueryParams(restQuery)}`

        const hmac = generateHmac(fullUrl, this.signedUrlModuleOptions.secret)
        const expiryDate = new Date(restQuery.expirationDate)

        if (!signed || !hmac) {
            throw new ForbiddenException('Invalid Url')
        } else {
            return isSignatureEqual(signed, hmac) && signatureHasNotExpired(expiryDate);
        }
    }
}
