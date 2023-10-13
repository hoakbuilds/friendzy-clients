import { loadWallet } from 'utils';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/utils/token';
import { BN } from '@coral-xyz/anchor';
import {
  calculateKeyPriceUi,
  deriveMetadataAddress,
} from '@keycenter-labs/friendzy-client/utils';
import { MPL_TOKEN_METADATA_PROGRAM_ID } from '@keycenter-labs/friendzy-client/constants';
import axios from 'axios';
import { Mint, unpackMint } from '@solana/spl-token';
import {
  TokenStandard,
  safeFetchAllMetadata,
} from '@metaplex-foundation/mpl-token-metadata';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { fromWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters';
import { isSome } from '@metaplex-foundation/umi';

// Load  Env Variables
require('dotenv').config({
  path: __dirname + `/default.env`,
});

require('dotenv').config({
  path: __dirname + `/.env`, // Can also be used to override default env variables
});

// Constants
const CLUSTER = process.env.CLUSTER || 'mainnet-beta';
const RPC_URL = process.env.RPC_URL;
const KP_PATH = process.env.KEYPAIR_PATH;

export const main = async () => {
  console.log('Running getHoldings.');

  const wallet = loadWallet(KP_PATH);
  console.log('Wallet Public Key: ' + wallet.publicKey.toString());

  const connection = new Connection(RPC_URL);

  const umi = createUmi(RPC_URL);

  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
    wallet.publicKey,
    { programId: TOKEN_PROGRAM_ID },
  );
  console.log(`Token Accounts: ${tokenAccounts.value.length}`);

  const tokenMints = tokenAccounts.value.map(
    ta => new PublicKey(ta.account.data.parsed['info']['mint']),
  );
  const tokenMintsAccountInfos = await connection.getMultipleAccountsInfo(
    tokenMints,
  );

  const tokenMintAccounts = [];

  for (const i in tokenMints) {
    tokenMintAccounts.push(
      unpackMint(tokenMints[i], tokenMintsAccountInfos[i]),
    );
  }

  console.log(`Token Mint Accounts: ${tokenMintAccounts.length}`);

  const metadatas = [];

  for (const i in tokenAccounts.value) {
    const tokenMint = tokenMints[i];
    const tokenAccount = tokenAccounts.value[i];
    if (tokenAccount.account) {
      const decimals =
        tokenAccount.account.data.parsed['info']['tokenAmount']['decimals'];
      if (decimals != '0') {
        metadatas.push(
          deriveMetadataAddress(MPL_TOKEN_METADATA_PROGRAM_ID, tokenMint),
        );
      }
    }
  }

  const metadataAccounts = await safeFetchAllMetadata(umi, metadatas);

  const friendKeys = [];

  for (const i in tokenAccounts.value) {
    const tokenAccount = tokenAccounts.value[i];
    const tokenMint = tokenMints[i];
    const [metadata] = deriveMetadataAddress(
      MPL_TOKEN_METADATA_PROGRAM_ID,
      tokenMint,
    );
    const metadataAccount = metadataAccounts.filter(
      m => m.publicKey == fromWeb3JsPublicKey(metadata),
    )[0];
    if (tokenMint && tokenAccount && metadataAccount) {
      if (
        isSome(metadataAccount.tokenStandard) &&
        metadataAccount.tokenStandard.value == TokenStandard.Fungible &&
        metadataAccount.uri.indexOf('api.friendzy.gg') !== -1
      ) {
        const tokenAmount =
          tokenAccount.account.data.parsed['info']['tokenAmount'];
        if (tokenAmount['uiAmount'] !== 0) {
          const id = metadataAccount.name
            .split('@')[1]
            .trim()
            .replaceAll(/\0/g, '');
          let response = await axios.get(
            'https://api.friendzy.gg/v1/user/' + id,
          );
          let friendzyApiData = await response.data;

          const tokenMintAccount: Mint[] = tokenMintAccounts.filter(tma =>
            tma.address.equals(tokenMint),
          );
          const keyPrice = calculateKeyPriceUi(
            Number(tokenMintAccount[0].supply.toString()),
            1e9,
          );
          console.log(`Key ${friendzyApiData['name']} - Price: ${keyPrice}`);
          const value = keyPrice * tokenAmount['uiAmount'];
          friendKeys.push({
            mint: tokenMint,
            metadata: metadatas[i],
            tokenAccount: tokenAccount.pubkey,
            nativeAmount: tokenAmount['amount'],
            decimals: tokenAmount['decimals'],
            amount: tokenAmount['uiAmount'],
            uri: metadataAccount.uri.trim().replaceAll(/\0/g, ''),
            symbol: metadataAccount.symbol.trim().replaceAll(/\0/g, ''),
            id: new BN(id),
            name: friendzyApiData['name'],
            username: friendzyApiData['username'],
            keyPrice,
            nativeValue: value,
            value: value,
          });
        }
      }
    }
  }

  friendKeys.sort((a, b) => b.value - a.value);

  console.log('Holdings');
  console.table(friendKeys, ['name', 'value', 'amount']);

  const totalPortfolioValue: number = friendKeys
    .map(fk => fk.value)
    .reduce((sum: number, current: number) => sum + current);
  console.log('Total Portfolio Value: ' + totalPortfolioValue.toFixed(4));
};

main();
