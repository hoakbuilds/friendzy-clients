import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export function calculateKeysCost(supply: number, amount: number): BN {
  if (amount < 1) {
    return calculateKeyPrice(supply, amount * 1e9);
  }
  return [...Array(amount).keys()]
    .map(i => calculateKeyPrice(supply + i * 1e9, 1e9))
    .reduce((sum, current) => sum.add(current));
}

export function calculateKeysCostUi(
  supply: number,
  keysAmount: number,
): number {
  return calculateKeysCost(supply, keysAmount).toNumber() / LAMPORTS_PER_SOL;
}

export function calculateKeyPrice(supply: number, supplyChange: number): BN {
  // if supply change is negative means upply is decreasing
  // so we want to calculate prices going down
  if (supplyChange < 0) {
    return curveDifference(supply - supplyChange, supply);
  }
  return curveDifference(supply, supply + supplyChange);
}

export function calculateKeyPriceUi(
  supply: number,
  supplyChange: number,
): number {
  return calculateKeyPrice(supply, supplyChange).toNumber() / LAMPORTS_PER_SOL;
}

function curveDifference(pointA: number, pointB: number): BN {
  return new BN((curve(pointB) - curve(pointA)).toString()).abs();
}

function curve(point: number): bigint {
  return BigInt(595e8 + point) ** BigInt(2) / BigInt(12000000000000);
}
