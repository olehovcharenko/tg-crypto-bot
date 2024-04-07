import { Injectable } from '@nestjs/common';
import { Context, Telegraf } from 'telegraf';
import { ethers } from 'ethers';
import { WalletEntity } from 'src/bot/wallet.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ErrorCodesEnum, KeyboardOptionsEnum } from './bot.enums';
import { amountKeyboard, availableCommands } from './bot.constants';
import { IDefineAvailableBalance, IProcessTransaction } from './bot.interfaces';

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

    this.setupCommands();
    this.bot.launch();
  }

  private setupCommands(): void {
    this.bot.command('start', this.startHandler.bind(this));
    this.bot.command('createwallet', this.createWalletHandler.bind(this));
    this.bot.command('send', this.sendEthHandler.bind(this));
    this.bot.command('checkbalance', this.checkBalanceHandler.bind(this));
    this.bot.command('help', this.helpHandler.bind(this));
  }

  private async startHandler(ctx: Context): Promise<void> {
    await ctx.reply(
      'Welcome to the Ethereum wallet bot! Use /help for check available commands',
    );
  }

  private async helpHandler(ctx: Context): Promise<void> {
    const message = availableCommands
      .map((cmd) => `${cmd.command}: ${cmd.description}`)
      .join('\n');

    await ctx.reply(`Available commands:\n${message}`);
  }

  private async createWalletHandler(ctx: Context): Promise<void> {
    try {
      const userId = String(ctx.from.id);

      const existingWallet = await this.walletRepository.findOne({
        where: { userId },
      });
      if (existingWallet) {
        await ctx.reply('An ETH wallet for this user already exists.');
        return;
      }

      const etherWallet = ethers.Wallet.createRandom();

      const newWallet = new WalletEntity();
      newWallet.address = etherWallet.address;
      newWallet.privateKey = etherWallet.privateKey;
      newWallet.userId = userId;
      await this.walletRepository.save(newWallet);

      await ctx.reply(`Your new wallet address: ${etherWallet.address}`);
    } catch (error) {
      console.error('Error creating wallet:', error);
      await ctx.reply('Failed to create wallet. Please try again later.');
    }
  }

  private async checkBalanceHandler(ctx: any): Promise<void> {
    const args = ctx.message.text.split(' ');
    const address = args[1];

    if (!address) {
      await ctx.reply('Invalid address. Usage: /checkbalance <address>');
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

      await ctx.reply(
        `Balance of ${address}: ${parseFloat(ethers.formatEther(balance))} ETH`,
      );
    } catch (error) {
      await ctx.reply(
        'Failed to check address balance. Please try again later.',
      );
    }
  }

  private async sendEthHandler(ctx: any): Promise<void> {
    const args = ctx.message.text.split(' ');
    const recipientAddress = args[1];

    if (!recipientAddress) {
      await ctx.reply(
        'Invalid recipient address. Usage: /send <recipientAddress>',
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

    await ctx.reply('Select the amount you want to send:', {
      reply_markup: amountKeyboard,
    });

    this.bot.on('callback_query', async (query: any): Promise<void> => {
      const callbackData = query.update.callback_query.data;
      const recipientAddress = ctx.message.text.split(' ')[1];

      if (callbackData === KeyboardOptionsEnum.CustomAmount) {
        await ctx.reply('Enter the custom amount:');

        this.bot.on('text', async (msg: any): Promise<void> => {
          const customAmount = parseFloat(msg.text);

          if (!isNaN(customAmount) && customAmount > 0) {
            await this.processTransaction({
              ctx,
              recipientAddress,
              amount: customAmount,
            });
          } else {
            await ctx.reply('Invalid amount entered');
          }
        });
      } else if (callbackData === KeyboardOptionsEnum.OneHundredPercent) {
        const { availableBalance, gasPrice, gasLimit } =
          await this.defineBalanceAndGas(wallet.address);

        if (availableBalance <= 0) {
          await ctx.reply(
            'You do not have sufficient funds for this transaction.',
          );
          return;
        }

        await this.processTransaction({
          ctx,
          recipientAddress,
          amount: parseFloat(ethers.formatEther(availableBalance)),
          gasLimit,
          gasPrice,
        });
      } else {
        const percentage = parseFloat(callbackData);

        const balance = await this.provider.getBalance(wallet.address);

        if (!isNaN(percentage) && percentage > 0) {
          const amount =
            (percentage / 100) * parseFloat(ethers.formatEther(balance));

          await this.processTransaction({ ctx, recipientAddress, amount });
        } else {
          await ctx.reply('Invalid selection');
        }
      }
    });
  }

  private async processTransaction(data: IProcessTransaction): Promise<void> {
    const wallet = await this.walletRepository.findOne({
      where: { userId: String(data.ctx.from.id) },
    });

    if (!wallet || !wallet.privateKey) {
      await data.ctx.reply(`Wallets not found`);
      return;
    }

    const senderWallet = new ethers.Wallet(wallet.privateKey, this.provider);

    const amountInWei = ethers.parseEther(data.amount.toString());

    try {
      const transaction = await senderWallet.sendTransaction({
        to: data.recipientAddress,
        value: amountInWei,
        gasPrice: data.gasPrice,
        gasLimit: data.gasLimit,
      });

      await data.ctx.reply(
        `Successfully sent ${data.amount} ETH to ${data.recipientAddress}. \nTransaction hash: ${transaction.hash}`,
      );
    } catch (error) {
      console.error('Error sending ETH:', error);

      if (error.code === ErrorCodesEnum.INSUFFICIENT_FUNDS) {
        await data.ctx.reply(
          'You do not have sufficient funds for this transaction.',
        );
      } else {
        await data.ctx.reply(
          'An error occurred while sending ETH. Please try again later.',
        );
      }
    }
  }

  private async defineBalanceAndGas(
    address: string,
  ): Promise<IDefineAvailableBalance> {
    const balance = await this.provider.getBalance(address);

    const feeData = await this.provider.getFeeData();

    const gasPrice = BigInt(feeData.maxFeePerGas);

    const gasLimit = 21001n;

    const gasFee = gasPrice * BigInt(gasLimit);

    const availableBalance = balance - gasFee;

    return {
      availableBalance,
      gasLimit,
      gasPrice,
    };
  }
}
