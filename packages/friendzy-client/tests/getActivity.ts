/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
import { delay, loadWallet } from 'utils';
import {
  Account,
  Cluster,
  Metaplex,
  keypairIdentity,
  parseMetadataAccount,
  parseMintAccount,
  toBigNumber,
} from '@metaplex-foundation/js';
import {
  Connection,
  PublicKey,
  VersionedTransactionResponse,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/utils/token';
import { BN } from '@coral-xyz/anchor';
import {
  MPL_TOKEN_METADATA_PROGRAM_ID,
  PROGRAM_ID,
  calculateKeyPriceUi,
  deriveMetadataAddress,
} from '../dist/lib';
import axios from 'axios';
import {
  WithdrawInstructionData,
  SwapInstructionData,
} from '../src/instructions/index';
import {
  parseInstructionData,
  VerifyInstructionData,
} from '../src/instructions/index';

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
  console.log('Running getActivity.');

  const wallet = loadWallet(KP_PATH);
  console.log('Wallet Public Key: ' + wallet.publicKey.toString());

  const connection = new Connection(RPC_URL);

  const metaplex = Metaplex.make(connection, {
    cluster: CLUSTER as Cluster,
  }).use(keypairIdentity(wallet));

  const confirmedSignaturesInfo = await connection.getSignaturesForAddress(
    PROGRAM_ID,
  );
  console.log(
    `Fetched ${confirmedSignaturesInfo.length} confirmed signatures..`,
  );
  confirmedSignaturesInfo.reverse();

  //   const confirmedSignatures = confirmedSignaturesInfo.map(s => s.signature);
  //   const confirmedTransactions = await connection.getTransactions(
  //     confirmedSignatures,
  //     {
  //       commitment: 'confirmed',
  //       maxSupportedTransactionVersion: 0,
  //     },
  //   );
  //   console.log(
  //     `Fetched ${confirmedTransactions.length} confirmed transactions..`,
  //   );

  //   processTransactions(confirmedTransactions);

  let lastSignature =
    confirmedSignaturesInfo[confirmedSignaturesInfo.length - 1].signature;

  connection.onLogs(
    PROGRAM_ID,
    async logs => {
      if (logs.err) {
        console.log(`Signature: ${logs.signature} | Error: ${logs.err}`);
      } else {
        const transaction = await connection.getTransaction(logs.signature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
        });
        processTransactions([transaction]);
      }
    },
    'confirmed',
  );

  while (true) {
    // const confirmedSignaturesInfo = await connection.getSignaturesForAddress(
    //   PROGRAM_ID,
    //   { until: lastSignature },
    // );
    // console.log(
    //   `Fetched ${confirmedSignaturesInfo.length} confirmed signatures..`,
    // );
    // confirmedSignaturesInfo.reverse();
    // if (confirmedSignaturesInfo.length != 0) {
    //   const confirmedSignatures = confirmedSignaturesInfo.map(s => s.signature);
    //   const confirmedTransactions = await connection.getTransactions(
    //     confirmedSignatures,
    //     {
    //       commitment: 'confirmed',
    //       maxSupportedTransactionVersion: 0,
    //     },
    //   );
    //   console.log(
    //     `Fetched ${confirmedTransactions.length} confirmed transactions..`,
    //   );
    //   processTransactions(confirmedTransactions);
    //   lastSignature = confirmedSignatures[confirmedSignatures.length - 1];
    await delay(2500);
  }
};

function processTransactions(
  confirmedTransactions: VersionedTransactionResponse[],
): void {
  for (const confirmedTx of confirmedTransactions) {
    const accountKeys = confirmedTx.transaction.message.getAccountKeys();
    const friendzyInstructions =
      confirmedTx.transaction.message.compiledInstructions.filter(ci =>
        accountKeys.get(ci.programIdIndex).equals(PROGRAM_ID),
      );
    for (const ix of friendzyInstructions) {
      const data = parseInstructionData(ix.data);
      if (data instanceof VerifyInstructionData) {
        console.log(`Signer: ${accountKeys.get(0)} Verified: ${data.owner}`);
      } else if (data instanceof WithdrawInstructionData) {
        console.log(
          `Signer: ${accountKeys.get(0)} Claimed Royalties: ${data.id}`,
        );
      } else if (data instanceof SwapInstructionData) {
        console.log(
          `Time: ${confirmedTx.blockTime} Signer: ${accountKeys
            .get(0)
            .toString()
            .slice(0, 6)} ${data.side == 'Buy' ? 'Bought' : 'Sold'} ${
            data.amount
          } of ${data.id} at ${
            data.side == 'Buy' ? 'maximum' : 'minimum'
          } price of ${data.price}`,
        );
      }
    }
  }
}

main();
