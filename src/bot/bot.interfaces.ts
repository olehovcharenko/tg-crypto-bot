import { Context } from 'telegraf';

export interface IDefineAvailableBalance {
  readonly availableBalance: bigint;
  readonly gasLimit: bigint;
  readonly gasPrice: bigint;
}

export interface IProcessTransaction {
  readonly ctx: Context;
  readonly recipientAddress: string;
  readonly amount: number;
  readonly gasLimit?: bigint;
  readonly gasPrice?: bigint;
}
