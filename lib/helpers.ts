import { createHmac, timingSafeEqual } from 'crypto';
import { stringify as qsStringify } from 'qs'

import { PATH_METADATA } from '@nestjs/common/constants';
import { Controller } from '@nestjs/common/interfaces/controllers/controller.interface';

import { RESERVED_QUERY_PARAM_NAMES } from './signed-url.constants';


export type ControllerMethod = (...args: any[]) => Promise<any> | any

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

export function isParamsNameInURL(route: string, params: Record<string, string>): boolean {
    const routeParts = route.split('/:')
    return Object.keys(params).every(param => {
        return routeParts.includes(param)
    })
}

export function replaceParamsString(route: string, params: Record<string, string>): string {
    for (const [key, value] of Object.entries(params)) {
        route = route.replace(`:${key}`, encodeURIComponent(value))
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