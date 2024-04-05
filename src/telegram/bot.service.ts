import { Injectable } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { ethers } from 'ethers';
import { WalletEntity } from 'src/wallet/wallet.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class BotService {
  private bot: Telegraf;

  constructor(
    @InjectRepository(WalletEntity)
    private walletRepository: Repository<WalletEntity>,
  ) {
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
    const recipient = args[2];

    if (!amount || !recipient) {
      ctx.reply('Invalid command. Usage: /send <amount> <recipient_address>');
      return;
    }

    // Perform Ethereum transaction here using ethers.js
    // Example:
    // const wallet = await this.walletRepository.findOne(); // Get sender's wallet from database
    // const provider = new ethers.providers.JsonRpcProvider(process.env.ETH_NODE_URL);
    // const signer = new ethers.Wallet(wallet.privateKey, provider);
    // const transaction = await signer.sendTransaction({
    //   to: recipient,
    //   value: ethers.utils.parseEther(amount.toString()),
    // });

    ctx.reply(`Successfully sent ${amount} ETH to ${recipient}`);
  }
}
