import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { signedUrlModuleConfig } from './config/signed-url.config';
import { SignedUrlModule } from 'nestjs-url-generator';
import { ConfigModule } from '@nestjs/config/dist/config.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    SignedUrlModule.forRootAsync({
      useFactory: () => signedUrlModuleConfig(),
    })
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
