import { base64 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { ConfigAccount, ProfileAccount } from '../dist/lib/accounts';

describe('testing account decoding', () => {
  test('config should load', () => {
    const buffer = base64.decode(
      'AKDXUiVUIRAALr5DLwAAAApz5x/t0hNl7QruhPzk4rIGR/001ey9oRXwI9JjP4d4QBxARgAAAAApndAJAAAAAAAAAAAAAAAA',
    );
    const config = ConfigAccount.decode(buffer);
    console.log(config);
    expect(config.owner.toString()).toBe(
      'hoakwpFB8UoLnPpLC56gsjpY7XbVwaCuRQRMQzN5TVh',
    );
    expect(config.debt.toNumber()).toBe(0);
    expect(config.id.toString()).toBe('1162302698118684672');
    expect(config.supply.toNumber()).toBe(203000000000);
    expect(config.royalties.toNumber()).toBe(1178606656);
    expect(config.unclaimed.toNumber()).toBe(164666665);
    expect(config.royaltiesUi()).toBe(1.178606656);
    expect(config.claimedRoyaltiesUi()).toBe(1.013939991);
    expect(config.unclaimedUi()).toBe(0.164666665);
  });

  test('profile should load', () => {
    const buffer = base64.decode(
      'AKDXUiVUIRAKc+cf7dITZe0K7oT85OKyBkf9NNXsvaEV8CPSYz+HeAC4mj4KAAAAAAAAAAAAAADLyIBbAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    );
    const config = ProfileAccount.decode(buffer);
    console.log(config);
    expect(config.owner.toString()).toBe(
      'hoakwpFB8UoLnPpLC56gsjpY7XbVwaCuRQRMQzN5TVh',
    );
    expect(config.id.toString()).toBe('1162302698118684672');
    expect(config.buyAmount.toNumber()).toBe(44000000000);
    expect(config.sellAmount.toNumber()).toBe(0);
    expect(config.buyVolume.toNumber()).toBe(1535166667);
    expect(config.sellVolume.toNumber()).toBe(0);
    expect(config.buyAmountUi()).toBe(44);
    expect(config.sellAmountUi()).toBe(0);
    expect(config.buyVolumeUi()).toBe(1.535166667);
    expect(config.sellVolumeUi()).toBe(0);
  });
});
