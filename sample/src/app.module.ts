import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config/dist/config.module';
import { EmailModule } from './emailModule/email.module';
import { urlGeneratorModuleConfig } from './config/signed-url.config';
import { UrlGeneratorModule } from 'nestjs-url-generator';

@Module({
  imports: [
    ConfigModule.forRoot(),
    UrlGeneratorModule.forRootAsync({
      useFactory: () => urlGeneratorModuleConfig(),
    }),
    EmailModule,
  ],
  providers: [],
})
export class AppModule {}
