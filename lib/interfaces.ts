import { Controller } from '@nestjs/common/interfaces/controllers/controller.interface';

export type ControllerMethod = (...args: any[]) => Promise<any> | any

export interface GenerateUrlFromControllerArgs {
    controller: Controller
    controllerMethod: ControllerMethod
    query?: any
    params?: any
}

export interface GenerateUrlFromPathArgs {
    relativePath: string
    query?: any
    params?: any
}

export interface SignedControllerUrlArgs {
    controller: Controller
    controllerMethod: ControllerMethod
    expirationDate?: Date
    query?: any
    params?: any
}

export interface SignedUrlArgs {
    relativePath: string
    expirationDate?: Date
    query?: any
    params?: any
}

export interface IsSignatureValidArgs {
    host: string
    routePath: string
    query?: any
}