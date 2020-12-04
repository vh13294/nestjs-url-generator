import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';

import { SignedUrlGuard, UrlGeneratorService } from 'nestjs-url-generator';
import { EmailParams } from './params/email.params';
import { EmailQuery } from './query/email.query';

@Controller()
export class EmailController {
  constructor(private readonly urlGeneratorService: UrlGeneratorService) {}

  @Get('target/version/:version/user/:userId')
  async target(
    @Param() emailParams: EmailParams,
    @Query() emailQuery: EmailQuery,
  ): Promise<any> {
    return {
      emailParams,
      emailQuery,
    };
  }

  @Get('makeUrl')
  async makeUrl(): Promise<string> {
    const emailParams = {
      version: '1.0//.%$',
      userId: true,
    };

    const query: EmailQuery = {
      email: 'email',
      userId: 1,
      userProfile: {
        name: 'name',
        dateOfBirth: new Date(),
      },
    };

    const urlGenerator = this.urlGeneratorService.generateUrlFromController({
      controller: EmailController,
      controllerMethod: EmailController.prototype.target,
      query: query,
      params: emailParams,
    });
    return urlGenerator;
  }

  @Get('emailVerification/version/:version/user/:userId')
  @UseGuards(SignedUrlGuard)
  async emailVerification(
    @Param() emailParams: EmailParams,
    @Query() emailQuery: EmailQuery,
  ): Promise<any> {
    return {
      emailParams,
      emailQuery,
    };
  }

  @Get('makeSignedUrl')
  async makeSignedUrl(): Promise<string> {
    const emailParams = {
      version: '1.0//.%$',
      userId: true,
    };

    const query: EmailQuery = {
      email: 'email',
      userId: 1,
      userProfile: {
        name: 'name',
        dateOfBirth: new Date(),
      },
    };

    const urlGenerator = this.urlGeneratorService.signedControllerUrl({
      controller: EmailController,
      controllerMethod: EmailController.prototype.emailVerification,
      expirationDate: new Date('2021-12-12'),
      query: query,
      params: emailParams,
    });
    return urlGenerator;
  }
}
