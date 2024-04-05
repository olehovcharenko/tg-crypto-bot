import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletEntity } from './entities/wallet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WalletEntity])],
  controllers: [],
  providers: [BotService],
})
export class BotModule {}
