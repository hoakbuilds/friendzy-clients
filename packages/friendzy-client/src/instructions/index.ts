import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import { struct, u8 } from '@solana/buffer-layout';
import { publicKey, u64 } from '@solana/buffer-layout-utils';
import {
  ASSOCIATED_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@coral-xyz/anchor/dist/cjs/utils/token';
import { MPL_TOKEN_METADATA_PROGRAM_ID, PROGRAM_ID, VAULT } from '../constants';

export interface InstructionArgs {
  version: number;
  id: bigint;
  instruction: number;
}

export interface WithdrawArgs extends InstructionArgs {}

export interface VerifyArgs extends InstructionArgs {
  owner: PublicKey;
}

export interface SwapArgs extends InstructionArgs {
  side: 'Buy' | 'Sell';
  amount: bigint;
  price: bigint;
  placeholder: number;
}

export const WithdrawInstructionDataLayout = struct<WithdrawArgs>([
  u8('version'),
  u64('id'),
  u8('instruction'),
]);

function createWithdrawInstructionData(args: WithdrawArgs): Buffer {
  const buffer = Buffer.alloc(10);
  buffer[0] = 0;
  buffer.writeBigUInt64LE(args.id, 1);
  buffer[9] = 3;
  return buffer;
}

export type Side = {
  bid?: any;
  ask?: any;
};

export const SwapInstructionDataLayout = struct<SwapArgs>([
  u8('version'), // 0
  u64('id'), // 1
  u8('instruction'), // 9
  u64('amount'), // 17
  u64('price'), // 25
]);

function createSwapInstructionData(args: SwapArgs): Buffer {
  const buffer = Buffer.alloc(26);
  buffer[0] = 0;
  buffer.writeBigUInt64LE(args.id, 1);
  buffer[9] = args.side === 'Buy' ? 1 : 2;
  buffer.writeBigUInt64LE(args.amount, 10);
  buffer.writeBigUInt64LE(args.price, 18);
  return buffer;
}

export const VerifyInstructionDataLayout = struct<VerifyArgs>([
  u8('version'),
  u64('id'),
  publicKey('owner'),
  u8('instruction'),
]);

function createVerifyInstructionData(args: VerifyArgs): Buffer {
  let buffer = Buffer.alloc(42);
  buffer[0] = 0;
  buffer.writeBigUInt64LE(args.id, 1);
  buffer[9] = 0;
  args.owner.encode().copy(buffer, 10, 0, 42);
  return buffer;
}

export const createSwapInstruction = (
  user: PublicKey,
  bank: PublicKey,
  config: PublicKey,
  tokenMint: PublicKey,
  profile: PublicKey,
  metadata: PublicKey,
  tokenAccount: PublicKey,
  firstPurchase: boolean,
  args: SwapArgs,
): TransactionInstruction => {
  return {
    programId: PROGRAM_ID,
    keys: [
      [
        {
          pubkey: user,
          isSigner: true,
          isWritable: true,
        },
        {
          pubkey: bank,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: profile,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: tokenMint,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: config,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: TOKEN_PROGRAM_ID,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: SYSVAR_RENT_PUBKEY,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: true,
        },
      ],
      firstPurchase
        ? [
            { pubkey: metadata, isSigner: false, isWritable: true },
            {
              pubkey: MPL_TOKEN_METADATA_PROGRAM_ID,
              isSigner: false,
              isWritable: false,
            },
            { pubkey: tokenAccount, isSigner: false, isWritable: true },
          ]
        : [
            {
              pubkey: SystemProgram.programId,
              isSigner: false,
              isWritable: true,
            },
            {
              pubkey: SystemProgram.programId,
              isSigner: false,
              isWritable: false,
            },
            {
              pubkey: SystemProgram.programId,
              isSigner: false,
              isWritable: false,
            },
          ],
      [
        {
          pubkey: VAULT,
          isSigner: false,
          isWritable: true,
        },
        { pubkey: ASSOCIATED_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
    ].flat(),
    data: createSwapInstructionData(args),
  };
};

export const createVerifyInstruction = (
  args: VerifyArgs,
): TransactionInstruction => {
  return {
    programId: PROGRAM_ID,
    keys: [],
    data: createVerifyInstructionData(args),
  };
};

export const createWithdrawInstruction = (
  user: PublicKey,
  bank: PublicKey,
  config: PublicKey,
  tokenMint: PublicKey,
  profile: PublicKey,
  args: WithdrawArgs,
): TransactionInstruction => {
  return {
    programId: PublicKey.default,
    keys: [
      {
        pubkey: user,
        isSigner: true,
        isWritable: true,
      },
      {
        pubkey: bank,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: profile,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: tokenMint,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: config,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: TOKEN_PROGRAM_ID,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: SYSVAR_RENT_PUBKEY,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
    ],
    data: createWithdrawInstructionData(args),
  };
};
