import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotModule } from './telegram/bot.module';
import { WalletModule } from './wallet/wallet.module';
import { dataSourceOptions } from './config/config';

@Module({
  imports: [TypeOrmModule.forRoot(dataSourceOptions), BotModule, WalletModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
