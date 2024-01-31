<p align="center">
  <img width="40%" src="https://user-images.githubusercontent.com/17086745/97110220-8bf2f780-170a-11eb-9bf4-ca38b8d41be9.png" />
</p>

<h2 align="center">NestJS module for generating & signing URL</h2>

<p align="center">
    <a href="https://www.codefactor.io/repository/github/@tumainimosha/nestjs-url-generator">
        <img src="https://www.codefactor.io/repository/github/@tumainimosha/nestjs-url-generator/badge" alt="CodeFactor" />
    </a>
    <a href="https://www.npmjs.com/package/nestjs-url-generator">
        <img src="https://img.shields.io/npm/v/@tumainimosha/nestjs-url-generator.svg?style=flat-square&sanitize=true" alt="NPM Version" />
    </a>
    <a href="https://www.npmjs.com/package/nestjs-url-generator">
        <img src="https://img.shields.io/npm/dm/@tumainimosha/nestjs-url-generator.svg?style=flat-square&sanitize=true" alt="NPM Downloads" />
    </a>
    <a href="#">
        <img src="https://img.shields.io/npm/l/@tumainimosha/nestjs-url-generator.svg?colorB=black&label=LICENSE&style=flat-square&sanitize=true" alt="License"/>
    </a>
</p>

# Description

URL Generation is used to dynamically generate URL that point to NestJS controller method (Route).

nestjs-url-generator can generate plain and signed URLs

# Installation

```bash
npm i --save @tumainimosha/nestjs-url-generator
```

Or if you use Yarn:

```bash
yarn add @tumainimosha/nestjs-url-generator
```

# Requirements

`nestjs-url-generator` is built to work with Nest 7 and newer versions.

# Basic Usage

### Include Module

First you need to import [UrlGeneratorModule]:

> app.module.ts

```ts
import { UrlGeneratorModule } from '@tumainimosha/nestjs-url-generator';

@Module({
  imports: [
    UrlGeneratorModule.forRoot({
      secret: 'secret', // optional, required only for signed URL
      appUrl: 'https://localhost:3000',
    }),
  ],
})
export class ApplicationModule {}
```

Or Async Import With .ENV usage

> .ENV

```.env
APP_KEY=secret
APP_URL=https://localhost:3000
```

> signed-url.config.ts

```ts
import { UrlGeneratorModuleOptions } from '@tumainimosha/nestjs-url-generator';

export function urlGeneratorModuleConfig(): UrlGeneratorModuleOptions {
  return {
    secret: process.env.APP_KEY,
    appUrl: process.env.APP_URL,
  };
}
```

> app.module.ts

```ts
import { UrlGeneratorModule } from '@tumainimosha/nestjs-url-generator';

@Module({
  imports: [
    ConfigModule.forRoot(),
    UrlGeneratorModule.forRootAsync({
      useFactory: () => urlGeneratorModuleConfig(),
    }),
  ],
})
export class ApplicationModule {}
```

## Using Service

Now you need to register the service, by injecting it to the constructor.
There are two methods for generating url:

```typescript
generateUrlFromController({
  controller,
  controllerMethod,
  /*?*/ query,
  /*?*/ params,
});

generateUrlFromPath({
  relativePath,
  /*?*/ query,
  /*?*/ params,
});
```

> app.controller.ts

```ts
import { UrlGeneratorService } from '@tumainimosha/nestjs-url-generator';

@Controller()
export class AppController {
  constructor(private readonly urlGeneratorService: UrlGeneratorService) {}

  @Get('makeUrl')
  async makeUrl(): Promise<string> {
    const params = {
      version: '1.0',
      userId: 12,
    };

    const query = {
      email: 'email@email',
    };

    // This will generate:
    // https://localhost:3000/emailVerification/1.0/12?email=email%40email
    return this.urlGeneratorService.generateUrlFromController({
      controller: AppController,
      controllerMethod: AppController.prototype.emailVerification,
      query: query,
      params: params,
    });
  }
}
```

### Generate Signed URL

There are two methods for generating url:

```typescript
SignControllerUrl({
  controller,
  controllerMethod,
  /*?*/ expirationDate,
  /*?*/ query,
  /*?*/ params,
});

SignUrl({
  relativePath,
  /*?*/ expirationDate,
  /*?*/ query,
  /*?*/ params,
});
```

> app.controller.ts

```ts
import { UrlGeneratorService } from '@tumainimosha/nestjs-url-generator';

@Controller()
export class AppController {
  constructor(private readonly urlGeneratorService: UrlGeneratorService) {}

  @Get('makeSignUrl')
  async makeSignUrl(): Promise<string> {
    // This will generate:
    // https://localhost:3000/emailVerification?
    // expirationDate=2021-12-12T00%3A00%3A00.000Z&
    // signed=84b5a021c433d0ee961932ac0ec04d5dd5ffd6f7fdb60b46083cfe474dfae3c0
    return this.urlGeneratorService.SignControllerUrl({
      controller: AppController,
      controllerMethod: AppController.prototype.emailVerification,
      expirationDate: new Date('2021-12-12'),
      // or using DateTime library of your choice
      // will be expired 30 minutes after it was created
      expirationDate: dayjs().add(30, 'minute').toDate(),
    });
  }
}
```

- [expirationDate] and [signed] query keys are used for signed URL.

- By default, the signed URLs lives forever.
  You can add expiration date to them at the time of generating one.

### Reminder

The difference between params & query in ExpressJS

<img width="50%" src="https://user-images.githubusercontent.com/17086745/97456127-22bdef00-196b-11eb-89d2-d64d4324498d.png" />
<br>

## Using Guard

You can use SignUrlGuard to verify the signed url in controller.

If the url has been tampered or when the expiration date is due, then a Forbidden exception will be thrown.

> app.controller.ts

```ts
import { SignedUrlGuard } from '@tumainimosha/nestjs-url-generator';

@Controller()
export class AppController {
  constructor(private readonly urlGeneratorService: UrlGeneratorService) {}

  @Get('emailVerification')
  @UseGuards(SignedUrlGuard)
  async emailVerification(): Promise<string> {
    return 'You emailed has been verified.';
  }
}
```

## Note

- Changing the secret key will invalidate all signed urls
- Signed URL is typically used for unsubscribe email, email verification, sign file permission, and more.

- If you are using https with reverse proxy please make sure to enable trust proxy in express

```typescript
const app = await NestFactory.create<NestExpressApplication>(AppModule);

app.set('trust proxy', true);
// or
expressSession({ proxy: true });
```

## Generating Keys using node REPL

```javascript
require('crypto').randomBytes(64, (err, buf) => {
  if (err) throw err;
  console.log(`${buf.length} bytes of random data: ${buf.toString('base64')}`);
  process.exit();
});
```

### TODO

- [ ] Create unit test (expiration, tampered, with or without globalPrefix, request with or without query & param, if target for signerUrl doesn't have guard)

- [ ] Automate CI, npm run build, push, npm publish
