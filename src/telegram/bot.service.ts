import { Injectable } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { ethers } from 'ethers';
import { WalletEntity } from 'src/telegram/wallet.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class BotService {
  private bot: Telegraf;
  private readonly provider: ethers.JsonRpcProvider;

  constructor(
    @InjectRepository(WalletEntity)
    private walletRepository: Repository<WalletEntity>,
  ) {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_PROVIDER_URL);

    this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

    this.bot.command('start', this.startHandler.bind(this));
    this.bot.command('createwallet', this.createWalletHandler.bind(this));
    this.bot.command('send', this.sendEthHandler.bind(this));

    this.bot.launch();
  }

  async startHandler(ctx: any) {
    ctx.reply('Welcome to the Ethereum wallet bot!');
  }

  async createWalletHandler(ctx: any) {
    const wallet = ethers.Wallet.createRandom();
    const newWallet = new WalletEntity();
    newWallet.address = wallet.address;
    newWallet.privateKey = wallet.privateKey;

    await this.walletRepository.save(newWallet);

    ctx.reply(`Your new wallet address: ${wallet.address}`);
  }

  async sendEthHandler(ctx: any) {
    const args = ctx.message.text.split(' ');
    const amount = parseFloat(args[1]);
    const recipientAddress = args[2];

    if (!recipientAddress || isNaN(amount) || amount <= 0) {
      await ctx.reply(
        'Invalid parameters. Usage: /sendETH <recipientAddress> <amount>',
      );
      return;
    }

    const wallet = await this.walletRepository.findOne({
      where: { address: recipientAddress },
    });

    if (!wallet || !wallet.privateKey) {
      await ctx.reply(`Wallet with address ${recipientAddress} not found`);
      return;
    }

    const senderWallet = new ethers.Wallet(wallet.privateKey, this.provider);

    const amountInWei = ethers.parseEther(amount.toString());

    try {
      const transaction = await senderWallet.sendTransaction({
        to: recipientAddress,
        value: amountInWei,
      });

      await ctx.reply(
        `Successfully sent ${amount} ETH to ${recipientAddress}. Transaction hash: ${transaction.hash}`,
      );
      return transaction.hash;
    } catch (error) {
      console.error('Error sending ETH:', error);
      await ctx.reply(
        'An error occurred while sending ETH. Please try again later.',
      );
      return null;
    }
  }
}
