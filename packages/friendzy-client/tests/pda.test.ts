import {
  deriveBankAddress,
  deriveConfigAddress,
  deriveMetadataAddress,
  deriveMintAddress,
  deriveProfileAddress,
} from '../dist/lib/utils';
import { MPL_TOKEN_METADATA_PROGRAM_ID, PROGRAM_ID } from '../dist/lib/index';
import { BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

describe('testing pda derivations', () => {
  test('bank address', () => {
    const [address] = deriveBankAddress(PROGRAM_ID);
    expect(address.toString()).toBe(
      'DPVMvgcbmHz1FFFSYtoLSzQgPD59UbMguozL8RVfq5ud',
    );
  });

  test('mint address with id 1_162_302_698_118_684_672', () => {
    const [address] = deriveMintAddress(
      PROGRAM_ID,
      new BN('1162302698118684672'),
    );
    expect(address.toString()).toBe(
      'GUZJcmy4QRF3dXWcRxueyPGQfQAmRs1FtqiszRJaFfxV',
    );
  });

  test('config address with id 1_162_302_698_118_684_672', () => {
    const [address] = deriveConfigAddress(
      PROGRAM_ID,
      new BN('1162302698118684672'),
    );
    expect(address.toString()).toBe(
      '5Y3ac7p37XtSMmbb84QuP8dZTv3tfuH2pu1Wg6dokwDQ',
    );
  });

  test('profile address with id 1_162_302_698_118_684_672', () => {
    const [address] = deriveProfileAddress(
      PROGRAM_ID,
      new BN('1162302698118684672'),
      new PublicKey('hoakwpFB8UoLnPpLC56gsjpY7XbVwaCuRQRMQzN5TVh'),
    );
    expect(address.toString()).toBe(
      '74zFAk5CPA9SNmJPD2K7DqS8WMP1cG9G7DbKN1vyYiVd',
    );
  });

  test('metadata address with mint ', () => {
    const [mint] = deriveMintAddress(PROGRAM_ID, new BN('1162302698118684672'));
    const [address] = deriveMetadataAddress(
      MPL_TOKEN_METADATA_PROGRAM_ID,
      mint,
    );
    expect(address.toString()).toBe(
      '8FQs4Z7HDJG7LetoUkcBAnvEKJZaTNcurzbH6o6sxwPD',
    );
  });
});
