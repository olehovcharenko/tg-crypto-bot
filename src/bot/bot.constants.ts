import { KeyboardOptionsEnum } from './bot.enums';

export const amountKeyboard = {
  inline_keyboard: [
    [{ text: '25%', callback_data: KeyboardOptionsEnum.TwentyFivePercent }],
    [{ text: '50%', callback_data: KeyboardOptionsEnum.FiftyPercent }],
    [
      {
        text: '75%',
        callback_data: KeyboardOptionsEnum.SeventyFivePercent,
      },
    ],
    [
      {
        text: '100%',
        callback_data: KeyboardOptionsEnum.OneHundredPercent,
      },
    ],
    [
      {
        text: 'Custom Amount',
        callback_data: KeyboardOptionsEnum.CustomAmount,
      },
    ],
  ],
};

export const availableCommands = [
  { command: '/start', description: 'Start the bot' },
  {
    command: '/createwallet',
    description: 'Generate a new Ethereum wallet',
  },
  {
    command: '/send <recipientAddress>',
    description: 'Send ETH to another address',
  },
  {
    command: '/checkbalance <address>',
    description: 'Check the balance of an Ethereum address',
  },
  { command: '/help', description: 'Display available commands' },
];
