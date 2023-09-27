import { BN } from '@coral-xyz/anchor';
import {
  Account,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
} from '@solana/web3.js';
import { struct } from '@solana/buffer-layout';
import { u64, publicKey } from '@solana/buffer-layout-utils';
import { deriveConfigAddress, deriveProfileAddress } from '../utils/pda';
import { PROGRAM_ID } from '../constants';

export interface XIdAccount {
  xId: bigint;
}

export const ConfigLayout = struct<Config>([
  u64('xId'),
  u64('supply'),
  publicKey('owner'),
  u64('royalties'),
  u64('unclaimed'),
  u64('debt'),
]);

export interface Config extends XIdAccount {
  supply: bigint;
  owner: PublicKey;
  royalties: bigint;
  unclaimed: bigint;
  debt: bigint;
}

export interface AccountApi {
  id: BN;
  owner: PublicKey;
}

export interface ConfigApi extends AccountApi {
  supply: BN;
  royalties: BN;
  unclaimed: BN;
  debt: BN;
  claimedRoyaltiesUi(): number;
  royaltiesUi(): number;
  unclaimedUi(): number;
}

export class ConfigAccount implements ConfigApi {
  readonly state: Config;

  constructor(state: Config) {
    this.state = state;
  }

  public static async load(
    connection: Connection,
    id: BN,
  ): Promise<ConfigAccount> {
    const [config] = deriveConfigAddress(PROGRAM_ID, id);
    try {
      let { data } = (await connection.getAccountInfo(config)) || {};
      if (!data) return;
      const state = ConfigLayout.decode(data);
      return new ConfigAccount(state);
    } catch (err) {
      throw new Error(err);
    }
  }

  public static decode(buffer: Buffer | Uint8Array): ConfigAccount {
    try {
      const state = ConfigLayout.decode(buffer);
      return new ConfigAccount(state);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  get id(): BN {
    return new BN(this.state.xId.toString());
  }
  get supply(): BN {
    return new BN(this.state.supply.toString());
  }
  get unclaimed(): BN {
    return new BN(this.state.unclaimed.toString());
  }
  get royalties(): BN {
    return new BN(this.state.royalties.toString());
  }
  get debt(): BN {
    return new BN(this.state.debt.toString());
  }
  get owner(): PublicKey {
    return this.state.owner;
  }
  claimedRoyaltiesUi(): number {
    return this.royalties.sub(this.unclaimed).toNumber() / LAMPORTS_PER_SOL;
  }
  royaltiesUi(): number {
    return this.royalties.toNumber() / LAMPORTS_PER_SOL;
  }
  unclaimedUi(): number {
    return this.unclaimed.toNumber() / LAMPORTS_PER_SOL;
  }
}

export const ProfileLayout = struct<Profile>([
  u64('xId'),
  publicKey('owner'),
  u64('buyAmount'),
  u64('sellAmount'),
  u64('buyVolume'),
  u64('sellVolume'),
  u64('reserved'),
]);

export interface Profile extends XIdAccount {
  owner: PublicKey;
  buyAmount: bigint;
  sellAmount: bigint;
  buyVolume: bigint;
  sellVolume: bigint;
  reserved: bigint;
}

export interface ProfileApi extends AccountApi {
  buyAmount: BN;
  sellAmount: BN;
  buyVolume: BN;
  sellVolume: BN;
  buyAmountUi(): number;
  sellAmountUi(): number;
  buyVolumeUi(): number;
  sellVolumeUi(): number;
}

export class ProfileAccount implements ProfileApi {
  readonly state: Profile;

  constructor(state: Profile) {
    this.state = state;
  }

  public static async load(connection: Connection, id: BN, user: PublicKey) {
    const [profile] = deriveProfileAddress(PROGRAM_ID, id, user);
    try {
      let { data } = (await connection.getAccountInfo(profile)) || {};
      if (!data) return;
      const state = ProfileLayout.decode(data);
      return new ProfileAccount(state);
    } catch (err) {
      throw new Error(err);
    }
  }

  public static decode(buffer: Buffer | Uint8Array): ProfileAccount {
    try {
      const state = ProfileLayout.decode(buffer);
      return new ProfileAccount(state);
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
  get buyAmount(): BN {
    return new BN(this.state.buyAmount.toString());
  }
  get sellAmount(): BN {
    return new BN(this.state.sellAmount.toString());
  }
  get buyVolume(): BN {
    return new BN(this.state.buyVolume.toString());
  }
  get sellVolume(): BN {
    return new BN(this.state.sellVolume.toString());
  }
  buyAmountUi(): number {
    return this.buyAmount.toNumber() / LAMPORTS_PER_SOL;
  }
  sellAmountUi(): number {
    return this.sellAmount.toNumber() / LAMPORTS_PER_SOL;
  }
  buyVolumeUi(): number {
    return this.buyVolume.toNumber() / LAMPORTS_PER_SOL;
  }
  sellVolumeUi(): number {
    return this.sellVolume.toNumber() / LAMPORTS_PER_SOL;
  }
}
