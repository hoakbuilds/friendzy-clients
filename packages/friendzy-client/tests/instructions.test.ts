import { base64 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import {
  SwapInstructionDataLayout,
  WithdrawInstructionDataLayout,
} from '../dist/lib/instructions/';

describe('testing account decoding', () => {
  test('swap buy key should decode', () => {
    const buffer = base64.decode('AACg11IlVCEQAQDkC1QCAAAAlsmCHAAAAAA=');
    const swapArgs = SwapInstructionDataLayout.decode(buffer);
    console.log(swapArgs);
    expect(swapArgs.instruction).toBe(1); // this also means it's a buy
    expect(swapArgs.id.toString()).toBe('1162302698118684672');
    expect(swapArgs.amount.toString()).toBe('10000000000');
    expect(swapArgs.price.toString()).toBe('478333334');
  });

  test('swap sell key should decode', () => {
    const buffer = base64.decode('AACg11IlVCEQAgB0O6QLAAAAZcBHDgAAAAA=');
    const swapArgs = SwapInstructionDataLayout.decode(buffer);
    console.log(swapArgs);
    expect(swapArgs.instruction).toBe(2); // this also means it's a sell
    expect(swapArgs.id.toString()).toBe('1162302698118684672');
    expect(swapArgs.amount.toString()).toBe('50000000000');
    expect(swapArgs.price.toString()).toBe('239583333');
  });

  test('withdraw should decode', () => {
    const buffer = base64.decode('AACg11IlVCEQAw==');
    const withdrawArgs = WithdrawInstructionDataLayout.decode(buffer);
    console.log(withdrawArgs);
    expect(withdrawArgs.instruction).toBe(3);
    expect(withdrawArgs.id.toString()).toBe('1162302698118684672');
  });
});
