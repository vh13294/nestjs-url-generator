import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { urlGeneratorModuleConfig } from './config/signed-url.config';
import { UrlGeneratorModule } from 'nestjs-url-generator';
import { ConfigModule } from '@nestjs/config/dist/config.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    UrlGeneratorModule.forRootAsync({
      useFactory: () => urlGeneratorModuleConfig(),
    })
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
