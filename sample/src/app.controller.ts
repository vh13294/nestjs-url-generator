import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { SignedUrlGuard, UrlGeneratorService } from 'nestjs-url-generator';
import { EmailParams } from './params/email.params';
import { EmailQuery } from './query/email.query';

@Controller()
export class AppController {
  constructor(
    private readonly urlGeneratorService: UrlGeneratorService,
  ) { }

  @Get()
  getHello(): string {
    return 'hello world'
  }

  @Get('emailVerification/:version/:userId')
  @UseGuards(SignedUrlGuard)
  async emailVerification(
    @Param() emailParams: EmailParams,
    @Query() emailQuery: EmailQuery
  ): Promise<any> {
    return {
      emailParams,
      emailQuery
    }
  }

  @Get('makeUrl')
  async makeUrl(): Promise<string> {
    const emailParams = {
      version: '1.0//.%$',
      userId: true
    }

    const query: EmailQuery = {
      email: 'email',
      userId: 1,
      userProfile: {
        name: 'name',
        dateOfBirth: new Date
      }
    }

    const urlGenerator = this.urlGeneratorService.signedControllerURL(
      AppController,
      AppController.prototype.emailVerification,
      new Date('2021-12-12'),
      query,
      emailParams
    )
    return urlGenerator
  }
}
