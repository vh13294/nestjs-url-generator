<p align="center">
  <img width="40%" src="https://user-images.githubusercontent.com/17086745/97110220-8bf2f780-170a-11eb-9bf4-ca38b8d41be9.png" />
</p>

<h2 align="center">Signed URL Module for NestJS</h2>

<p align="center">
<a href="https://www.codefactor.io/repository/github/vh13294/nestjs-url-generator"><img src="https://www.codefactor.io/repository/github/vh13294/nestjs-url-generator/badge" alt="CodeFactor" /></a>
<a href="https://www.npmjs.com/package/nestjs-url-generator"><img src="https://img.shields.io/npm/v/nestjs-url-generator.svg?style=flat-square&sanitize=true" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/package/nestjs-url-generator"><img src="https://img.shields.io/npm/dm/nestjs-url-generator.svg?style=flat-square&sanitize=true" alt="NPM Downloads" /></a>
<a href="#"><img src="https://img.shields.io/npm/l/nestjs-url-generator.svg?colorB=black&label=LICENSE&style=flat-square&sanitize=true" alt="License"/></a>

</p>

# Description

`Signed URL` module for for [Nest](https://github.com/nestjs/nest) applications.

# Installation

```bash
npm i --save nestjs-url-generator
```

Or if you use Yarn:

```bash
yarn add nestjs-url-generator
```

# Requirements

`nestjs-url-generator` is built to work with Nest 7 and newer versions.

# Basic Usage

### Include Module

First you need to import this module into your module:

> app.module.ts

```ts
import { SignedUrlModule } from 'nestjs-url-generator';

@Module({
    imports: [
        SignedUrlModule.forRoot({
            secret: 'secret',
            appUrl: 'localhost:3000',
        })
    ],
})
export class ApplicationModule {}
```

Or Async Import With .ENV usage

> .ENV

```.env
APP_KEY=secret
APP_URL=localhost:3000
```

> signed-url.config.ts

```ts
export function signedUrlModuleConfig(): SignedUrlModuleOptions {
    return {
        secret: process.env.APP_KEY,
        appUrl: process.env.APP_URL,
    }
};
```

> app.module.ts

```ts
import { SignedUrlModule } from 'nestjs-url-generator';

@Module({
    imports: [
        ConfigModule.forRoot(),
        SignedUrlModule.forRootAsync({
            useFactory: () => signedUrlModuleConfig(),
        })
    ],
})
export class ApplicationModule {}
```


## Using Service

Now you need to register the service, by injecting it to the constructor.
There are two methods for signing url:

```typescript
signedControllerRoute(
    controller: Controller,
    controllerMethod: ControllerMethod,
    expirationDate: Date,
    query?: any,
    params?: any
)

signedRelativePathUrl(
    relativePath: string,
    expirationDate: Date,
    query?: any,
    params?: any
)
```
> app.controller.ts

```ts
import { SignedUrlService } from 'nestjs-url-generator';

@Controller()
export class AppController {
    constructor(
        private readonly signedUrlService: SignedUrlService,
    ) { }

    @Get('makeSignedUrl')
    async makeSignedUrl(): Promise<string> {
        const query = {
            id: 1,
            info: 'info',
        }

        return this.signedUrlService.signedControllerRoute(
            AppController,
            AppController.prototype.emailVerification,
            new Date('2021-12-12'),
            query
        )
    }
}
```

'expirationDate' and 'signed' query are used internally by nestjs-url-generator.

Exception will be thrown if those query are used.


### Reminder

<img width="60%" src="https://user-images.githubusercontent.com/17086745/97279922-2ae43480-186e-11eb-8946-acf3f168def8.png" />
<br>


## Using Guard

You can use SignedUrlGuard to verify the signed url in controller.

If the url has been tampered or when the expiration date is due, then a Forbidden exception will be thrown.

> app.controller.ts

```ts
import { SignedUrlGuard } from 'nestjs-url-generator';

@Controller()
export class AppController {
    constructor(
        private readonly signedUrlService: SignedUrlService,
    ) { }

    @Get('emailVerification')
    @UseGuards(SignedUrlGuard)
    async emailVerification(): Promise<string> {
        return 'You emailed has been verified.'
    }
}

```


## Note
- Changing the secret key will invalidate all signed urls
- Signed URL is typically used for unsubscribe email, email verification, sign file permission, and more.


### TODO
- [ ] Create test (expiration, query clash, tampered, with or without globalPrefix, request with query & param)
- [ ] Renovate Automated dependency updates
- [ ] Add params obj(check if key duplicate in url & replace /:a/:b) long with query obj
- [ ] Automate CI, npm run build, push, npm publish, npm i (in sample after rebuild)