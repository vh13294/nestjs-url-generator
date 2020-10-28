import { createHmac, timingSafeEqual } from 'crypto';
import { stringify as qsStringify } from 'qs'

import { PATH_METADATA } from '@nestjs/common/constants';
import { Controller } from '@nestjs/common/interfaces/controllers/controller.interface';

import { RESERVED_QUERY_PARAM_NAMES } from './url-generator.constants';
import { BadRequestException } from '@nestjs/common';


export type ControllerMethod = (...args: any[]) => Promise<any> | any


export function generateUrl(
    appUrl: string,
    prefix: string,
    relativePath: string,
    query: any = {},
): string {
    const path = joinRoutes(appUrl, prefix, relativePath)
    const queryString = stringifyQueryParams(query)
    const fullPath = appendQueryParams(path, queryString)
    return fullPath
}

export function stringifyQueryParams(query: Record<string, unknown>): string {
    return qsStringify(query)
}

export function getControllerMethodRoute(
    controller: Controller,
    controllerMethod: ControllerMethod,
): string {
    const controllerRoute = Reflect.getMetadata(PATH_METADATA, controller)
    const methodRoute = Reflect.getMetadata(PATH_METADATA, controllerMethod)
    return joinRoutes(controllerRoute, methodRoute)
}

export function isRouteNotEmpty(route: string): boolean {
    return (!!route && route !== '/')
}

export function joinRoutes(...routes: string[]): string {
    return routes.filter(route => isRouteNotEmpty(route)).join('/')
}

export function isParamsNameInUrl(route: string, params: Record<string, string>): boolean {
    const routeParts = route.split('/:')
    return Object.keys(params).every(param => {
        return routeParts.includes(param)
    })
}

export function putParamsInUrl(route: string, params: Record<string, string>): string {
    if (params) {
        if (isParamsNameInUrl(route, params)) {
            for (const [key, value] of Object.entries(params)) {
                route = route.replace(`:${key}`, encodeURIComponent(value))
            }
        } else {
            throw new BadRequestException('One of the params name does not exist in target URL')
        }
    }
    return route
}

export function appendQueryParams(route: string, query: string): string {
    return `${route}?${query}`
}

export function generateHmac(url: string, secret: string): string {
    const hmac = createHmac('sha256', secret)
    hmac.update(url, 'utf8')
    return hmac.digest('hex')
}

export function isSignatureEqual(signed: string, hmacValue: string): boolean {
    return timingSafeEqual(Buffer.from(signed), Buffer.from(hmacValue))
}

export function signatureHasNotExpired(expiryDate: Date): boolean {
    const currentDate = new Date()
    return (expiryDate > currentDate)
}

export function checkIfQueryHasReservedKeys(query: Record<string, unknown>): boolean {
    const keyArr = Object.keys(query)
    return RESERVED_QUERY_PARAM_NAMES.some((r: string) => keyArr.includes(r))
}