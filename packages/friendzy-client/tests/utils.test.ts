import {
  calculateKeyPrice,
  calculateKeyPriceUi,
  calculateKeysCost,
  calculateKeysCostUi,
} from '../dist/lib/utils';

describe('testing key price calculation', () => {
  test('native price to buy should be 10_000_000', () => {
    expect(calculateKeyPrice(0, 1e9).toNumber()).toBe(10_000_000);
  });

  test('ui price to buy should be 0.01', () => {
    expect(calculateKeyPriceUi(0, 1e9)).toBe(0.01);
  });

  test('native price to buy should be 10166667', () => {
    expect(calculateKeyPrice(1e9, 1e9).toNumber()).toBe(10166667);
  });

  test('ui price to buy should be 0.010166667', () => {
    expect(calculateKeyPriceUi(1e9, 1e9)).toBe(0.010166667);
  });

  test('native price to sell should be 10166667', () => {
    expect(calculateKeyPrice(1e9, -1e9).toNumber()).toBe(10166667);
  });

  test('ui price to sell should be 0.010166667', () => {
    expect(calculateKeyPriceUi(1e9, -1e9)).toBe(0.010166667);
  });

  test('native price to buy should be 10333333', () => {
    expect(calculateKeyPrice(2e9, 1e9).toNumber()).toBe(10333333);
  });

  test('ui price to buy should be 0.010333333', () => {
    expect(calculateKeyPriceUi(2e9, 1e9)).toBe(0.010333333);
  });

  test('native price to sell should be 010333333', () => {
    expect(calculateKeyPrice(2e9, -1e9).toNumber()).toBe(10333333);
  });

  test('ui price to sell should be 0.010333333', () => {
    expect(calculateKeyPriceUi(2e9, -1e9)).toBe(0.010333333);
  });

  test('native price to buy should be 0.447385', () => {
    expect(calculateKeyPrice(2624310000000, 1e9).toNumber()).toBe(447385000);
  });

  test('ui price to buy should be 0.447385', () => {
    expect(calculateKeyPriceUi(2624310000000, 1e9)).toBe(0.447385);
  });

  test('native to buy should be 0.169996667', () => {
    expect(calculateKeyPrice(959980000000, 1e9).toNumber()).toBe(169996667);
  });

  test('ui price to buy should be 0.169996667', () => {
    expect(calculateKeyPriceUi(959980000000, 1e9)).toBe(0.169996667);
  });

  test('native cost of buying 10 keys with starting supply of 2889320000000 should be 49230333330', () => {
    expect(calculateKeysCost(2889320000000, 10).toNumber()).toBe(4923033333);
  });

  test('native cost of buying half a key with starting supply of 1e9 should be 5062500', () => {
    expect(calculateKeysCost(1e9, 0.5).toNumber()).toBe(5062500);
  });

  test('native cost of buying half a key with starting supply of 1e9 should be 4.92303', () => {
    expect(calculateKeysCostUi(2889320000000, 10)).toBe(4.923033333);
  });

  test('native cost of buying half a key with starting supply of 1e9 should be 0.0050625', () => {
    expect(calculateKeysCostUi(1e9, 0.5)).toBe(0.0050625);
  });
});
