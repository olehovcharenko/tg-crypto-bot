import { DataSource } from 'typeorm';
import { WalletEntity } from '../wallet/wallet.entity';
import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();

export const connectionSource = new DataSource({
  type: 'mysql',
  host: configService.get('DB_HOST'),
  port: configService.get('DB_PORT'),
  username: configService.get('DB_USERNAME'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_DATABASE'),
  entities: [WalletEntity],
});
