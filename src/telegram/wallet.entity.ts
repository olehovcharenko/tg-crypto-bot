import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'wallet' })
export class WalletEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  address: string;

  @Column()
  privateKey: string;

  @Column()
  balance: string;
}
