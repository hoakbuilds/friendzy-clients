import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export function calculateKeysCost(supply: number, keysAmount: number): BN {
  if (keysAmount < 1) {
    return calculateFractionalKeyPrice(supply, keysAmount * 1e9);
  }
  return [...Array(keysAmount).keys()]
    .map((i) => calculateKeyPrice(supply + i * 1e9))
    .reduce((sum, current) => sum.add(current));
}

export function calculateKeysCostUi(
  supply: number,
  keysAmount: number,
): number {
  return calculateKeysCost(supply, keysAmount).toNumber() / LAMPORTS_PER_SOL;
}

export function calculateKeyPrice(supply: number): BN {
  return curveDifference(supply, supply + 1e9);
}

export function calculateFractionalKeyPrice(
  supply: number,
  amount: number,
): BN {
  return curveDifference(supply, supply + amount);
}

export function calculateKeyPriceUi(supply: number): number {
  return calculateKeyPrice(supply).toNumber() / LAMPORTS_PER_SOL;
}

export function calculateFractionalKeyPriceUi(
  supply: number,
  amount: number,
): number {
  return (
    calculateFractionalKeyPrice(supply, amount).toNumber() / LAMPORTS_PER_SOL
  );
}

function curveDifference(pointA: number, pointB: number): BN {
  return curve(pointB).sub(curve(pointA));
}

function curve(point: number): BN {
  return new BN(
    Number(BigInt(595e8 + point) ** BigInt(2) / BigInt(12000000000000)),
  );
}
