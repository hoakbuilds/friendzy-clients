/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
import { loadWallet } from 'utils';
import {
  Account,
  Cluster,
  Metaplex,
  keypairIdentity,
  parseMetadataAccount,
  parseMintAccount,
  toBigNumber,
} from '@metaplex-foundation/js';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/utils/token';
import { BN } from '@coral-xyz/anchor';
import {
  MPL_TOKEN_METADATA_PROGRAM_ID,
  calculateKeyPriceUi,
  deriveMetadataAddress,
} from '../dist/lib';
import axios from 'axios';

// Load  Env Variables
require('dotenv').config({
  path: __dirname + `/default.env`,
});

require('dotenv').config({
  path: __dirname + `/args.env`, // Can also be used to override default env variables
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

  const metaplex = Metaplex.make(connection, {
    cluster: CLUSTER as Cluster,
  }).use(keypairIdentity(wallet));

  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
    metaplex.identity().publicKey,
    { programId: TOKEN_PROGRAM_ID },
  );

  const tokenMints = tokenAccounts.value.map(
    ta => new PublicKey(ta.account.data.parsed['info']['mint']),
  );
  const tokenMintsAccountInfos = await connection.getMultipleAccountsInfo(
    tokenMints,
  );

  const tokenMintAccounts = [];

  for (const i in tokenMints) {
    tokenMintAccounts.push(
      parseMintAccount({
        data: tokenMintsAccountInfos[i].data,
        executable: tokenMintsAccountInfos[i].executable,
        lamports: {
          currency: {
            symbol: 'SOL',
            decimals: 9,
          },
          basisPoints: toBigNumber(0),
        },
        publicKey: tokenMints[i],
        owner: tokenMintsAccountInfos[i].owner,
        rentEpoch: tokenMintsAccountInfos[i].rentEpoch,
      }),
    );
  }

  const metadatas = tokenMints.map(tm => {
    const [metadata] = deriveMetadataAddress(MPL_TOKEN_METADATA_PROGRAM_ID, tm);
    return metadata;
  });

  const metadataAccountInfos = await connection.getMultipleAccountsInfo(
    metadatas,
  );

  const friendKeys = [];

  for (const i in metadatas) {
    const tokenMint = tokenMints[i];
    const metadataAccountInfo = metadataAccountInfos[i];
    const tokenAccount = tokenAccounts.value[i];
    if (tokenMint && metadataAccountInfo && tokenAccount) {
      const metadataAccount = parseMetadataAccount({
        data: metadataAccountInfo.data,
        executable: metadataAccountInfo.executable,
        lamports: {
          currency: {
            symbol: 'SOL',
            decimals: 9,
          },
          basisPoints: toBigNumber(0),
        },
        publicKey: metadatas[i],
        owner: metadataAccountInfo.owner,
        rentEpoch: metadataAccountInfo.rentEpoch,
      });
      if (
        metadataAccount.data.tokenStandard == 2 &&
        metadataAccount.data.data.uri.indexOf('api.friendzy.gg') !== -1
      ) {
        const uiAmount =
          tokenAccount.account.data.parsed['info']['tokenAmount']['uiAmount'];
        if (uiAmount !== 0) {
          const id = metadataAccount.data.data.name
            .split('@')[1]
            .trim()
            .replaceAll(/\0/g, '');
          let response = await axios.get(
            'https://api.friendzy.gg/v1/user/' + id,
          );
          let friendzyApiData = await response.data;

          const tokenMintAccount = tokenMintAccounts.filter(tma =>
            tma.publicKey.equals(tokenMint),
          );
          const keyPrice = calculateKeyPriceUi(
            Number(tokenMintAccount[0].data.supply.toString()),
            1e9,
          );
          const value = keyPrice * uiAmount;
          friendKeys.push({
            mint: tokenMint,
            metadata: metadatas[i],
            tokenAccount: tokenAccount.pubkey,
            amount:
              tokenAccount.account.data.parsed['info']['tokenAmount']['amount'],
            decimals:
              tokenAccount.account.data.parsed['info']['tokenAmount'][
                'decimals'
              ],
            uiAmount,
            uri: metadataAccount.data.data.uri.trim().replaceAll(/\0/g, ''),
            symbol: metadataAccount.data.data.symbol
              .trim()
              .replaceAll(/\0/g, ''),
            id: new BN(id),
            name: friendzyApiData['name'],
            username: friendzyApiData['username'],
            keyPrice,
            value: value,
            valueFixed: value.toFixed(4),
          });
        }
      }
    }
  }

  friendKeys.sort((a, b) => b.value - a.value);

  console.log('Holdings');
  console.table(friendKeys, ['username', 'valueFixed']);

  const totalPortfolioValue: number = friendKeys
    .map(fk => fk.value)
    .reduce((sum: number, current: number) => sum + current);
  console.log('Total Portfolio Value: ' + totalPortfolioValue.toFixed(4));
};

main();
