import { ApplicationConfig } from '@nestjs/core';
import { Inject, Injectable, Logger, ForbiddenException } from '@nestjs/common';

import { UrlGeneratorModuleOptions } from './url-generator-options.interface';
import { URL_GENERATOR_MODULE_OPTIONS } from './url-generator.constants';

import {
  generateHmac,
  getControllerMethodRoute,
  signatureHasExpired,
  isSignatureEqual,
  stringifyQuery,
  generateUrl,
  appendQuery,
  checkIfMethodHasSignedGuardDecorator,
} from './helpers';

import {
  GenerateUrlFromControllerArgs,
  GenerateUrlFromPathArgs,
  IsSignatureValidArgs,
  ReservedQuery,
  SignControllerUrlArgs,
  SignUrlArgs,
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

    const url = new URL(this.urlGeneratorModuleOptions.appUrl);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw Error('Protocol is required in url');
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

  public signControllerUrl({
    controller,
    controllerMethod,
    expirationDate,
    query,
    params,
  }: SignControllerUrlArgs): string {
    checkIfMethodHasSignedGuardDecorator(controller, controllerMethod);

    const controllerMethodFullRoute = getControllerMethodRoute(
      controller,
      controllerMethod,
    );

    return this.signUrl({
      relativePath: controllerMethodFullRoute,
      expirationDate,
      query,
      params,
    });
  }

  public signUrl({
    relativePath,
    expirationDate,
    query,
    params,
  }: SignUrlArgs): string {
    const cloneQuery = Object.assign({}, query) as ReservedQuery;

    if (expirationDate) {
      cloneQuery.expirationDate = expirationDate.toISOString();
    }
    const urlWithoutHash = generateUrl(
      this.urlGeneratorModuleOptions.appUrl,
      this.applicationConfig.getGlobalPrefix(),
      relativePath,
      cloneQuery,
      params,
    );

    cloneQuery.signed = generateHmac(
      urlWithoutHash,
      this.urlGeneratorModuleOptions.secret,
    );
    const urlWithHash = generateUrl(
      this.urlGeneratorModuleOptions.appUrl,
      this.applicationConfig.getGlobalPrefix(),
      relativePath,
      cloneQuery,
      params,
    );

    return urlWithHash;
  }

  public isSignatureValid({
    protocol,
    host,
    routePath,
    query,
  }: IsSignatureValidArgs): boolean {
    const { signed, ...restQuery } = query;

    const path = `${protocol}://${host}${routePath}`;
    const queryString = stringifyQuery(restQuery);
    const fullPath = appendQuery(path, queryString);

    const hmac = generateHmac(fullPath, this.urlGeneratorModuleOptions.secret);

    if (!signed || !hmac || signed.length != hmac.length) {
      throw new ForbiddenException('Invalid Url');
    } else {
      if (restQuery.expirationDate) {
        const expirationDate = new Date(restQuery.expirationDate);
        if (signatureHasExpired(expirationDate)) return false;
      }
      return isSignatureEqual(signed, hmac);
    }
  }
}
