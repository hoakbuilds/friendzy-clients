import { base64 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import {
  deriveBankAddress,
  deriveConfigAddress,
  deriveMetadataAddress,
  deriveMintAddress,
  deriveProfileAddress,
} from '../dist/lib/utils';
import { MPL_TOKEN_METADATA_PROGRAM_ID, PROGRAM_ID } from '../dist/lib';
import { BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { associatedAddress } from '@coral-xyz/anchor/dist/cjs/utils/token';
import {
  SwapInstructionData,
  WithdrawInstructionData,
  createSwapInstructionData,
  createWithdrawInstructionData,
  createSwapInstruction,
  VerifyInstructionData,
  createVerifyInstructionData,
} from '../dist/lib/instructions/index';

describe('testing account decoding', () => {
  test('instruction accounts for buyer different than token id owner should be', () => {
    const id: BN = new BN('1436880221354045450');
    const buyer = new PublicKey('62MVSTf76iJWrRhzfC2Dj178Cax1pLSNYkwWBkbpxYcx');
    const user = new PublicKey('Gf3sbc5Jb62jH7WcTr3WSNGDQLk1w6wcKMZXKK1SC1E6');
    const [bank] = deriveBankAddress(PROGRAM_ID);
    const [mint] = deriveMintAddress(PROGRAM_ID, id);
    const [config] = deriveConfigAddress(PROGRAM_ID, id);

    const [profile] = deriveProfileAddress(PROGRAM_ID, id, buyer);
    const [metadata] = deriveMetadataAddress(
      MPL_TOKEN_METADATA_PROGRAM_ID,
      mint,
    );

    const tokenAccount = associatedAddress({ mint, owner: buyer });

    const ix = createSwapInstruction(
      user,
      bank,
      config,
      mint,
      profile,
      metadata,
      tokenAccount,
      false,
      {
        side: 'Sell',
        id,
        amount: new BN(1_000_000_000),
        price: new BN(100_000_000),
      },
    );
    expect(ix.keys[0].pubkey.toString()).toBe(
      'Gf3sbc5Jb62jH7WcTr3WSNGDQLk1w6wcKMZXKK1SC1E6',
    );
    expect(ix.keys[1].pubkey.toString()).toBe(
      'DPVMvgcbmHz1FFFSYtoLSzQgPD59UbMguozL8RVfq5ud',
    );
    expect(ix.keys[2].pubkey.toString()).toBe(
      '4uorXMmdWgHJXpwVpvgKhMQj3XrGuUidVD2D8J6nY3im',
    );
    expect(ix.keys[3].pubkey.toString()).toBe(
      '7UfnA6tNvxU317xsesFJhRCUpQJ8m63ooLGKSC9m5vjp',
    );
    expect(ix.keys[4].pubkey.toString()).toBe(
      'w7zrXGJ9hZrZPVQmMznsXZkmd2y3HMYY3azmvk1mcG8',
    );
    expect(ix.keys[8].pubkey.toString()).toBe(
      '11111111111111111111111111111111',
    );
    expect(ix.keys[9].pubkey.toString()).toBe(
      '11111111111111111111111111111111',
    );
    expect(ix.keys[10].pubkey.toString()).toBe(
      'Hf46PDJyCGACRnJGXoP44SSAJ5Zw9igLgkmS9yVyNgFX',
    );
  });

  test('instruction accounts for first purchase should be', () => {
    const id: BN = new BN('1436880221354045450');
    const user = new PublicKey('Gf3sbc5Jb62jH7WcTr3WSNGDQLk1w6wcKMZXKK1SC1E6');
    const [bank] = deriveBankAddress(PROGRAM_ID);
    const [mint] = deriveMintAddress(PROGRAM_ID, id);
    const [config] = deriveConfigAddress(
      PROGRAM_ID,
      new BN('1436880221354045450'),
    );
    const [profile] = deriveProfileAddress(
      PROGRAM_ID,
      new BN('1436880221354045450'),
      user,
    );
    const [metadata] = deriveMetadataAddress(
      MPL_TOKEN_METADATA_PROGRAM_ID,
      mint,
    );

    const tokenAccount = associatedAddress({ mint, owner: user });

    const ix = createSwapInstruction(
      user,
      bank,
      config,
      mint,
      profile,
      metadata,
      tokenAccount,
      false,
      {
        side: 'Sell',
        id,
        amount: new BN(1_000_000_000),
        price: new BN(100_000_000),
      },
    );
    expect(ix.keys[0].pubkey.toString()).toBe(
      'Gf3sbc5Jb62jH7WcTr3WSNGDQLk1w6wcKMZXKK1SC1E6',
    );
    expect(ix.keys[1].pubkey.toString()).toBe(
      'DPVMvgcbmHz1FFFSYtoLSzQgPD59UbMguozL8RVfq5ud',
    );
    expect(ix.keys[2].pubkey.toString()).toBe(
      '4uorXMmdWgHJXpwVpvgKhMQj3XrGuUidVD2D8J6nY3im',
    );
    expect(ix.keys[3].pubkey.toString()).toBe(
      '7UfnA6tNvxU317xsesFJhRCUpQJ8m63ooLGKSC9m5vjp',
    );
    expect(ix.keys[4].pubkey.toString()).toBe(
      'AkExwVartUp5NEdw8Zj5vEvaPqakMeT9fkvutRBGT6Hb',
    );
    expect(ix.keys[8].pubkey.toString()).toBe(
      '11111111111111111111111111111111',
    );
    expect(ix.keys[9].pubkey.toString()).toBe(
      '11111111111111111111111111111111',
    );
    expect(ix.keys[10].pubkey.toString()).toBe(
      'A5k4TeKZ67X91MKmWLofQGoEdAFvhTokU7Stz9wQ2Me',
    );
  });

  test('instruction accounts for follow up purchases should be', () => {
    const id: BN = new BN('1436880221354045450');
    const user = new PublicKey('Gf3sbc5Jb62jH7WcTr3WSNGDQLk1w6wcKMZXKK1SC1E6');
    const [bank] = deriveBankAddress(PROGRAM_ID);
    const [mint] = deriveMintAddress(PROGRAM_ID, id);
    const [config] = deriveConfigAddress(
      PROGRAM_ID,
      new BN('1436880221354045450'),
    );
    const [profile] = deriveProfileAddress(
      PROGRAM_ID,
      new BN('1436880221354045450'),
      user,
    );
    const [metadata] = deriveMetadataAddress(
      MPL_TOKEN_METADATA_PROGRAM_ID,
      mint,
    );

    const tokenAccount = associatedAddress({ mint, owner: user });

    const ix = createSwapInstruction(
      user,
      bank,
      config,
      mint,
      profile,
      metadata,
      tokenAccount,
      true,
      {
        side: 'Sell',
        id,
        amount: new BN(1_000_000_000),
        price: new BN(100_000_000),
      },
    );
    expect(ix.keys[0].pubkey.toString()).toBe(
      'Gf3sbc5Jb62jH7WcTr3WSNGDQLk1w6wcKMZXKK1SC1E6',
    );
    expect(ix.keys[1].pubkey.toString()).toBe(
      'DPVMvgcbmHz1FFFSYtoLSzQgPD59UbMguozL8RVfq5ud',
    );
    expect(ix.keys[2].pubkey.toString()).toBe(
      '4uorXMmdWgHJXpwVpvgKhMQj3XrGuUidVD2D8J6nY3im',
    );
    expect(ix.keys[3].pubkey.toString()).toBe(
      '7UfnA6tNvxU317xsesFJhRCUpQJ8m63ooLGKSC9m5vjp',
    );
    expect(ix.keys[4].pubkey.toString()).toBe(
      'AkExwVartUp5NEdw8Zj5vEvaPqakMeT9fkvutRBGT6Hb',
    );
    expect(ix.keys[8].pubkey.toString()).toBe(metadata.toString());
    expect(ix.keys[9].pubkey.toString()).toBe(
      MPL_TOKEN_METADATA_PROGRAM_ID.toString(),
    );
    expect(ix.keys[10].pubkey.toString()).toBe(
      'A5k4TeKZ67X91MKmWLofQGoEdAFvhTokU7Stz9wQ2Me',
    );
  });

  test('swap instruction buy data should decode and encode', () => {
    const buffer = base64.decode('AACg11IlVCEQAQDkC1QCAAAAlsmCHAAAAAA=');
    const swapData = SwapInstructionData.decode(buffer);
    console.log(swapData);
    expect(swapData.side).toBe('Buy');
    expect(swapData.id.toString()).toBe('1162302698118684672');
    expect(swapData.amount.toString()).toBe('10000000000');
    expect(swapData.price.toString()).toBe('478333334');

    const buffer2 = createSwapInstructionData({
      side: 'Buy',
      id: new BN('1162302698118684672'),
      amount: new BN('10000000000'),
      price: new BN('478333334'),
    });
    expect(base64.encode(buffer2)).toBe('AACg11IlVCEQAQDkC1QCAAAAlsmCHAAAAAA=');
  });

  test('swap instruction sell data should decode and encode', () => {
    const buffer = base64.decode('AACg11IlVCEQAgB0O6QLAAAAZcBHDgAAAAA=');
    const swapData = SwapInstructionData.decode(buffer);
    console.log(swapData);
    expect(swapData.side).toBe('Sell');
    expect(swapData.id.toString()).toBe('1162302698118684672');
    expect(swapData.amount.toString()).toBe('50000000000');
    expect(swapData.price.toString()).toBe('239583333');

    const buffer2 = createSwapInstructionData({
      side: 'Sell',
      id: new BN('1162302698118684672'),
      amount: new BN('50000000000'),
      price: new BN('239583333'),
    });
    expect(base64.encode(buffer2)).toBe('AACg11IlVCEQAgB0O6QLAAAAZcBHDgAAAAA=');
  });

  test('withdraw instruction should decode and encode', () => {
    const buffer = base64.decode('AACg11IlVCEQAw==');
    const withdrawData = WithdrawInstructionData.decode(buffer);
    console.log(withdrawData);
    expect(withdrawData.id.toString()).toBe('1162302698118684672');

    const buffer2 = createWithdrawInstructionData({
      id: new BN('1162302698118684672'),
    });
    expect(base64.encode(buffer2)).toBe('AACg11IlVCEQAw==');
  });

  test('verify instruction data should decode and encode', () => {
    const buffer = base64.decode(
      'AACg11IlVCEQAApz5x/t0hNl7QruhPzk4rIGR/001ey9oRXwI9JjP4d4',
    );
    const verifyData = VerifyInstructionData.decode(buffer);
    console.log(verifyData);
    expect(verifyData.id.toString()).toBe('1162302698118684672');

    const buffer2 = createVerifyInstructionData({
      owner: new PublicKey('hoakwpFB8UoLnPpLC56gsjpY7XbVwaCuRQRMQzN5TVh'),
      id: new BN('1162302698118684672'),
    });
    expect(base64.encode(buffer2)).toBe(
      'AACg11IlVCEQAApz5x/t0hNl7QruhPzk4rIGR/001ey9oRXwI9JjP4d4',
    );
  });
});
