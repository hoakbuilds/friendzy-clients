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
import { BN } from '@coral-xyz/anchor';

interface InstructionDataSchema {
  version: number;
  xId: bigint;
  instruction: number;
}

interface VerifyInstructionDataSchema extends InstructionDataSchema {
  owner: PublicKey;
}

interface SwapInstructionDataSchema extends InstructionDataSchema {
  amount: bigint;
  price: bigint;
  placeholder: number;
}

export interface InstructionArgs {
  id: BN;
}

export interface WithdrawArgs extends InstructionArgs {}

export interface VerifyArgs extends InstructionArgs {
  owner: PublicKey;
}

export interface SwapArgs {
  side: 'Buy' | 'Sell';
  id: BN;
  amount: BN;
  price: BN;
}

const InstructionDataLayout = struct<InstructionDataSchema>([
  u8('version'),
  u64('xId'),
  u8('instruction'),
]);

export function createWithdrawInstructionData(args: WithdrawArgs): Buffer {
  const buffer = Buffer.alloc(10);
  buffer[0] = 0;
  args.id.toArrayLike(Buffer, 'le', 8).copy(buffer, 1);
  buffer[9] = 3;
  return buffer;
}

const SwapInstructionDataLayout = struct<SwapInstructionDataSchema>([
  u8('version'), // 0
  u64('xId'), // 1
  u8('instruction'), // 9
  u64('amount'), // 17
  u64('price'), // 25
]);

export function createSwapInstructionData(args: SwapArgs): Buffer {
  const buffer = Buffer.alloc(26);
  buffer[0] = 0;
  args.id.toArrayLike(Buffer, 'le', 8).copy(buffer, 1);
  buffer[9] = args.side === 'Buy' ? 1 : 2;
  args.amount.toArrayLike(Buffer, 'le', 8).copy(buffer, 10);
  args.price.toArrayLike(Buffer, 'le', 8).copy(buffer, 18);
  return buffer;
}

const VerifyInstructionDataLayout = struct<VerifyInstructionDataSchema>([
  u8('version'),
  u64('xId'),
  u8('instruction'),
  publicKey('owner'),
]);

export function createVerifyInstructionData(args: VerifyArgs): Buffer {
  let buffer = Buffer.alloc(42);
  buffer[0] = 0;
  args.id.toArrayLike(Buffer, 'le', 8).copy(buffer, 1);
  buffer[9] = 0;
  Buffer.from(args.owner.toBytes()).copy(buffer, 10);
  return buffer;
}

export interface InstructionDataApi {
  version: number;
  id: BN;
  instruction: number;
}

export class InstructionData implements InstructionDataApi {
  readonly state: InstructionDataSchema;

  constructor(state: InstructionDataSchema) {
    this.state = state;
  }

  public static decode(buffer: Buffer | Uint8Array): WithdrawInstructionData {
    try {
      const state = InstructionDataLayout.decode(buffer);
      return new InstructionData(state);
    } catch (err: any) {
      throw new Error(err);
    }
  }
  get id(): BN {
    return new BN(this.state.xId.toString());
  }
  get version(): number {
    return this.state.version;
  }
  get instruction(): number {
    return this.state.instruction;
  }
}

export class WithdrawInstructionData extends InstructionData {
  constructor(state: InstructionDataSchema) {
    super(state);
  }

  public static decode(buffer: Buffer | Uint8Array): WithdrawInstructionData {
    try {
      const state = InstructionDataLayout.decode(buffer);
      return new WithdrawInstructionData(state);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}

export interface VerifyInstructionDataApi extends InstructionDataApi {
  owner: PublicKey;
}

export class VerifyInstructionData
  extends InstructionData
  implements VerifyInstructionDataApi
{
  readonly state: VerifyInstructionDataSchema;

  constructor(state: VerifyInstructionDataSchema) {
    super(state);
    this.state = state;
  }

  public static decode(buffer: Buffer | Uint8Array): VerifyInstructionData {
    try {
      const state = VerifyInstructionDataLayout.decode(buffer);
      return new VerifyInstructionData(state);
    } catch (err: any) {
      throw new Error(err);
    }
  }
  get id(): BN {
    return new BN(this.state.xId.toString());
  }
  get owner(): PublicKey {
    return this.state.owner;
  }
}

export interface SwapInstructionDataApi extends InstructionDataApi {
  side: 'Buy' | 'Sell';
  id: BN;
  amount: BN;
  price: BN;
}

export class SwapInstructionData
  extends InstructionData
  implements SwapInstructionDataApi
{
  readonly state: SwapInstructionDataSchema;

  constructor(state: SwapInstructionDataSchema) {
    super(state);
    this.state = state;
  }

  public static decode(buffer: Buffer | Uint8Array): SwapInstructionData {
    try {
      const state = SwapInstructionDataLayout.decode(buffer);
      return new SwapInstructionData(state);
    } catch (err: any) {
      throw new Error(err);
    }
  }
  get side(): 'Buy' | 'Sell' {
    return this.state.instruction == 1 ? 'Buy' : 'Sell';
  }
  get id(): BN {
    return new BN(this.state.xId.toString());
  }
  get amount(): BN {
    return new BN(this.state.amount.toString());
  }
  get price(): BN {
    return new BN(this.state.price.toString());
  }
}

export const parseInstructionData = (
  buffer: Buffer | Uint8Array,
): WithdrawInstructionData | VerifyInstructionData | SwapInstructionData => {
  if (buffer[9] === 0) {
    return VerifyInstructionData.decode(buffer);
  }
  if (buffer[9] === 1) {
    return SwapInstructionData.decode(buffer);
  }
  if (buffer[9] === 2) {
    return SwapInstructionData.decode(buffer);
  }
  if (buffer[9] === 3) {
    return WithdrawInstructionData.decode(buffer);
  }

  throw new Error('Invalid instruction data.');
};

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
          pubkey: config,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: tokenMint,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: profile,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: TOKEN_PROGRAM_ID,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: SYSVAR_RENT_PUBKEY,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
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
              isWritable: false,
            },
            {
              pubkey: SystemProgram.programId,
              isSigner: false,
              isWritable: false,
            },
            { pubkey: tokenAccount, isSigner: false, isWritable: true },
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
        pubkey: config,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: tokenMint,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: profile,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: TOKEN_PROGRAM_ID,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: SYSVAR_RENT_PUBKEY,
        isSigner: false,
        isWritable: false,
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
