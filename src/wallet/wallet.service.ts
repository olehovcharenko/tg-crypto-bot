import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class WalletService {
  async createWallet(): Promise<string> {
    const wallet = ethers.Wallet.createRandom();
    return wallet.address;
  }

  async sendETH(
    senderPrivateKey: string,
    recipientAddress: string,
    amount: ethers.BigNumberish,
  ): Promise<string> {
    const provider = ethers.getDefaultProvider('ropsten');
    const wallet = new ethers.Wallet(senderPrivateKey, provider);
    const transaction = await wallet.sendTransaction({
      to: recipientAddress,
      value: amount,
    });
    return transaction.hash;
  }
}
