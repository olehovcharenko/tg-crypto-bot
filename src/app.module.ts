import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotModule } from './telegram/bot.module';
import { WalletModule } from './wallet/wallet.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WalletEntity } from './wallet/wallet.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USER'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [WalletEntity],
      }),
    }), WalletModule, BotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
