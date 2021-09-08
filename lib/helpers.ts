import { createHmac, timingSafeEqual } from 'crypto';
import { stringify as qsStringify } from 'qs';

import { BadRequestException } from '@nestjs/common';
import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';

import { ControllerMethod, Query, Params, ControllerClass } from './interfaces';
import { SignedUrlGuard } from './signed-url-guard';

export function generateUrl(
  appUrl: string,
  prefix: string,
  relativePath: string,
  query?: Query,
  params?: Params,
): string {
  relativePath = putParamsInUrl(relativePath, params);
  const path = joinRoutes(appUrl, prefix, relativePath);
  const queryString = stringifyQuery(query);
  const fullPath = appendQuery(path, queryString);
  return fullPath;
}

export function stringifyQuery(query?: Query): string {
  return qsStringify(query);
}

export function getControllerMethodRoute(
  controller: ControllerClass,
  controllerMethod: ControllerMethod,
): string {
  const controllerRoute = Reflect.getMetadata(PATH_METADATA, controller);
  const methodRoute = Reflect.getMetadata(PATH_METADATA, controllerMethod);
  return joinRoutes(controllerRoute, methodRoute);
}

export function checkIfMethodHasSignedGuardDecorator(
  controller: ControllerClass,
  controllerMethod: ControllerMethod,
): void {
  const arrOfClasses = Reflect.getMetadata(GUARDS_METADATA, controllerMethod);
  const errorMessage = `Please add SignedUrlGuard to ${controller.name}.${controllerMethod.name}`;
  if (!arrOfClasses) {
    throw new BadRequestException(errorMessage);
  }

  const guardExist = arrOfClasses.includes(SignedUrlGuard);
  if (!guardExist) {
    throw new BadRequestException(errorMessage);
  }
}

export function generateHmac(url: string, secret?: string): string {
  if (!secret) {
    throw new BadRequestException('Secret key is needed for signing URL');
  }

  const hmac = createHmac('sha256', secret);
  hmac.update(url, 'utf8');
  return hmac.digest('hex');
}

export function isSignatureEqual(signed: string, hmacValue: string): boolean {
  return timingSafeEqual(Buffer.from(signed), Buffer.from(hmacValue));
}

export function signatureHasExpired(expirationDate: Date): boolean {
  const currentDate = new Date();
  return currentDate > expirationDate;
}

function isRouteNotEmpty(route: string): boolean {
  return !!route && route !== '/';
}

function isParamsNameInUrl(route: string, params: Params): boolean {
  const routeParts = route
    .split('/')
    .filter((path) => path[0] === ':')
    .map((path) => path.substr(1));

  return Object.keys(params).every((param) => {
    return routeParts.includes(param);
  });
}

function joinRoutes(...routes: string[]): string {
  return routes.filter((route) => isRouteNotEmpty(route)).join('/');
}

export function appendQuery(route: string, query: string): string {
  if (query) {
    return `${route}?${query}`;
  }
  return route;
}

function putParamsInUrl(route: string, params?: Params): string {
  if (params) {
    if (isParamsNameInUrl(route, params)) {
      for (const [key, value] of Object.entries(params)) {
        route = route.replace(`:${key}`, encodeURIComponent(value));
      }
    } else {
      throw new BadRequestException(
        'One of the params key does not exist in target URL',
      );
    }
  }
  return route;
}
