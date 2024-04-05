import { Injectable } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { ethers } from 'ethers';
import { WalletEntity } from 'src/telegram/wallet.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EtherErrorCodesEnum } from './error-codes.enum';
import { TransactionEntity } from './transaction.entity';

@Injectable()
export class BotService {
  private bot: Telegraf;
  private readonly provider: ethers.JsonRpcProvider;

  constructor(
    @InjectRepository(WalletEntity)
    private walletRepository: Repository<WalletEntity>,
    @InjectRepository(TransactionEntity)
    private transactionRepository: Repository<TransactionEntity>,
  ) {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_PROVIDER_URL);

    this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

    this.bot.command('start', this.startHandler.bind(this));
    this.bot.command('createWallet', this.createWalletHandler.bind(this));
    this.bot.command('send', this.sendEthHandler.bind(this));
    this.bot.command('checkBalance', this.checkBalance.bind(this));
    this.bot.command('help', this.helpHandler.bind(this)); // Add help command

    this.bot.launch();
  }

  async startHandler(ctx: any) {
    ctx.reply(
      'Welcome to the Ethereum wallet bot! Use /help for check available commands',
    );
  }

  async createWalletHandler(ctx: any) {
    const wallet = ethers.Wallet.createRandom();
    const newWallet = new WalletEntity();
    newWallet.address = wallet.address;
    newWallet.privateKey = wallet.privateKey;
    newWallet.userId = String(ctx.from.id);

    await this.walletRepository.save(newWallet);

    ctx.reply(`Your new wallet address: ${wallet.address}`);
  }

  async checkBalance(ctx: any) {
    const args = ctx.message.text.split(' ');
    const address = args[1];

    if (!address) {
      await ctx.reply('Invalid address. Usage: /checkBalance <address>');
      return;
    }

    const wallet = await this.walletRepository.findOne({
      where: { address },
    });

    if (!wallet) {
      await ctx.reply(`Wallet with address ${address} not found`);
      return;
    }

    try {
      const balance = await this.provider.getBalance(address);

      await this.walletRepository.update(
        { address: address },
        { balance: String(balance) },
      );

      await ctx.reply(`Balance of ${address}: ${balance} ETH`);
    } catch (error) {
      await ctx.reply(
        'Failed to check address balance. Please try again later.',
      );
    }
  }

  async sendEthHandler(ctx: any) {
    const args = ctx.message.text.split(' ');
    const amount = parseFloat(args[1]);
    const recipientAddress = args[2];

    if (!recipientAddress || isNaN(amount) || amount <= 0) {
      await ctx.reply(
        'Invalid parameters. Usage: /send <recipientAddress> <amount>',
      );
      return;
    }

    const wallet = await this.walletRepository.findOne({
      where: { userId: ctx.from.id },
    });

    if (!wallet || !wallet.privateKey) {
      await ctx.reply(`Wallets not found`);
      return;
    }

    const senderWallet = new ethers.Wallet(wallet.privateKey, this.provider);

    const amountInWei = ethers.parseEther(amount.toString());

    try {
      const transaction = await senderWallet.sendTransaction({
        to: recipientAddress,
        value: amountInWei,
      });

      await this.transactionRepository.save({
        addressFrom: transaction.from,
        addressTo: recipientAddress,
        amount: amount.toString(),
        hash: transaction.hash,
      });

      await ctx.reply(
        `Successfully sent ${amount} ETH to ${recipientAddress}. Transaction hash: ${transaction.hash}`,
      );
    } catch (error) {
      console.error('Error sending ETH:', error);

      if (error.code === EtherErrorCodesEnum.INSUFFICIENT_FUNDS) {
        await ctx.reply('Insufficient funds');
      } else {
        await ctx.reply(
          'An error occurred while sending ETH. Please try again later.',
        );
      }

      return null;
    }
  }
  async helpHandler(ctx: any) {
    const availableCommands = [
      { command: '/start', description: 'Start the bot' },
      {
        command: '/createWallet',
        description: 'Generate a new Ethereum wallet',
      },
      {
        command: '/send <recipientAddress> <amount>',
        description: 'Send ETH to another address',
      },
      {
        command: '/checkBalance <address>',
        description: 'Check the balance of an Ethereum address',
      },
      { command: '/help', description: 'Display available commands' },
    ];

    let message = 'Available commands:\n';
    availableCommands.forEach((cmd) => {
      message += `${cmd.command}: ${cmd.description}\n`;
    });

    await ctx.reply(message);
  }
}
