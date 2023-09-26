import { utils } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export const deriveBankAddress = (
  programId: PublicKey,
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [utils.bytes.utf8.encode('bank')],
    programId,
  );
};

export const deriveMintAddress = (
  programId: PublicKey,
  id: BN,
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [utils.bytes.utf8.encode('mint'), id.toArrayLike(Buffer, 'le', 8)],
    programId,
  );
};

export const deriveProfileAddress = (
  programId: PublicKey,
  id: BN,
  user: PublicKey,
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [
      utils.bytes.utf8.encode('config'),
      id.toArrayLike(Buffer, 'le', 8),
      user.toBuffer(),
    ],
    programId,
  );
};

export const deriveConfigAddress = (
  programId: PublicKey,
  id: BN,
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [utils.bytes.utf8.encode('config'), id.toArrayLike(Buffer, 'le', 8)],
    programId,
  );
};

export const deriveMetadataAddress = (
  metadataProgramId: PublicKey,
  mint: PublicKey,
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [
      utils.bytes.utf8.encode('metadata'),
      metadataProgramId.toBuffer(),
      mint.toBuffer(),
    ],
    metadataProgramId,
  );
};
