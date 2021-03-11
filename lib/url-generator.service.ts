import { ApplicationConfig } from '@nestjs/core';
import {
  Inject,
  Injectable,
  Logger,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

import { UrlGeneratorModuleOptions } from './url-generator-options.interface';
import {
  RESERVED_QUERY_PARAM_NAMES,
  URL_GENERATOR_MODULE_OPTIONS,
} from './url-generator.constants';

import {
  generateHmac,
  getControllerMethodRoute,
  signatureHasExpired,
  isSignatureEqual,
  checkIfQueryHasReservedKeys,
  stringifyQueryParams,
  generateUrl,
  isObjectEmpty,
} from './helpers';

import {
  GenerateUrlFromControllerArgs,
  GenerateUrlFromPathArgs,
  IsSignatureValidArgs,
  SignedControllerUrlArgs,
  SignedUrlArgs,
} from './interfaces';

@Injectable()
export class UrlGeneratorService {
  constructor(
    @Inject(URL_GENERATOR_MODULE_OPTIONS)
    private readonly urlGeneratorModuleOptions: UrlGeneratorModuleOptions,
    private readonly applicationConfig: ApplicationConfig,
  ) {
    if (this.urlGeneratorModuleOptions.secret) {
      const byteLength = Buffer.byteLength(
        this.urlGeneratorModuleOptions.secret,
      );
      if (byteLength < 32) {
        Logger.warn(
          '[urlGeneratorModuleOptions] The key size is recommended to be between 32-64 bytes',
        );
      }
    }

    if (!this.urlGeneratorModuleOptions.appUrl) {
      throw new Error('The app url must not be empty');
    }
  }

  public generateUrlFromController({
    controller,
    controllerMethod,
    query,
    params,
  }: GenerateUrlFromControllerArgs): string {
    const controllerMethodFullRoute = getControllerMethodRoute(
      controller,
      controllerMethod,
    );

    return this.generateUrlFromPath({
      relativePath: controllerMethodFullRoute,
      query,
      params,
    });
  }

  public generateUrlFromPath({
    relativePath,
    query,
    params,
  }: GenerateUrlFromPathArgs): string {
    return generateUrl(
      this.urlGeneratorModuleOptions.appUrl,
      this.applicationConfig.getGlobalPrefix(),
      relativePath,
      query,
      params,
    );
  }

  public signedControllerUrl({
    controller,
    controllerMethod,
    expirationDate,
    query,
    params,
  }: SignedControllerUrlArgs): string {
    const controllerMethodFullRoute = getControllerMethodRoute(
      controller,
      controllerMethod,
    );

    return this.signedUrl({
      relativePath: controllerMethodFullRoute,
      expirationDate,
      query,
      params,
    });
  }

  public signedUrl({
    relativePath,
    expirationDate,
    query = {},
    params,
  }: SignedUrlArgs): string {
    if (query && checkIfQueryHasReservedKeys(query)) {
      throw new ConflictException(
        'Your target URL has a query param that is used for signing a route.' +
          ` eg. [${RESERVED_QUERY_PARAM_NAMES.join(', ')}]`,
      );
    }

    if (expirationDate) {
      query.expirationDate = expirationDate.toISOString();
    }
    const urlWithoutHash = generateUrl(
      this.urlGeneratorModuleOptions.appUrl,
      this.applicationConfig.getGlobalPrefix(),
      relativePath,
      query,
      params,
    );

    query.signed = generateHmac(
      urlWithoutHash,
      this.urlGeneratorModuleOptions.secret,
    );
    const urlWithHash = generateUrl(
      this.urlGeneratorModuleOptions.appUrl,
      this.applicationConfig.getGlobalPrefix(),
      relativePath,
      query,
      params,
    );

    return urlWithHash;
  }

  public isSignatureValid({
    host,
    routePath,
    query,
  }: IsSignatureValidArgs): boolean {
    const { signed, ...restQuery } = query;
    const url = isObjectEmpty(restQuery)
      ? `${host}${routePath}`
      : `${host}${routePath}?${stringifyQueryParams(restQuery)}`;

    const protocol = this.urlGeneratorModuleOptions.appUrl.match(
      /^(http(s?)\:\/\/)?/g,
    );

    const fullUrl = `${protocol && protocol[0] ? protocol[0] : ''}${url}`;

    const hmac = generateHmac(fullUrl, this.urlGeneratorModuleOptions.secret);

    if (!signed || !hmac || signed.length != hmac.length) {
      throw new ForbiddenException('Invalid Url');
    } else {
      if (restQuery.expirationDate) {
        const expiryDate = new Date(restQuery.expirationDate);
        if (signatureHasExpired(expiryDate)) return false;
      }
      return isSignatureEqual(signed, hmac);
    }
  }
}
