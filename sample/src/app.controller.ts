import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { SignedUrlGuard, SignedUrlService } from 'nestjs-url-generator';
import { EmailParams } from './params/email.params';
import { EmailQuery } from './query/email.query';

@Controller()
export class AppController {
  constructor(
    private readonly signedUrlService: SignedUrlService,
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

  @Get('makeSignedUrl')
  async makeSignedUrl(): Promise<string> {
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

    const signedUrl = this.signedUrlService.signedControllerRoute(
      AppController,
      AppController.prototype.emailVerification,
      new Date('2021-12-12'),
      query,
      emailParams
    )
    return signedUrl
  }
}
