import { Module } from '@nestjs/common';

import { BotService } from './bot.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WalletModule } from '../wallet/wallet.module';

@Module({

  providers: [BotService],
})
export class BotModule {}
