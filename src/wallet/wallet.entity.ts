import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class WalletEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  address: string;

  @Column()
  privateKey: string;
}
