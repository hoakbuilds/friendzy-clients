use solana_client::rpc_client::RpcClient;
use anchor_spl::token::spl_token;
use anchor_lang::AnchorDeserialize;
use spl_associated_token_account::{get_associated_token_address, instruction::create_associated_token_account_idempotent};
use friendzy_client::*;
use solana_sdk::{signer::Signer, pubkey::Pubkey, signature::Keypair, transaction::Transaction, message::Message};
use std::{str::FromStr, path::Path, fs::File, io::Read};

/// The length in bytes of a keypair, to match the underlying Ed25519 Keypair.
pub const KEYPAIR_LENGTH: usize = 64;

/// Loads a Solana [`Keypair`] from a file at the given path.
///
/// ### Errors
///
/// This function will return an error if something goes wrong while attempting to open or
/// read the file, or finally in case the [`Keypair`] bytes in the file are invalid.
///
/// ### Format
///
/// The file should have the following format, and in total should have [`KEYPAIR_LENGTH`] bytes.
///
/// \[123,34,78,0,1,3,45(...)\]
#[inline(always)]
pub fn load_keypair<P>(path: P) -> Keypair
where
    P: AsRef<Path>,
{
    let mut file = File::open(path).unwrap();

    let file_string = &mut String::new();
    file.read_to_string(file_string).unwrap();

    let mut replace = file_string
        .replace('[', "")
        .replace(']', "")
        .replace(',', " ")
        .trim()
        .to_string();

    // remove trailing newline
    if replace.ends_with('\n') {
        replace.pop();
        if replace.ends_with('\r') {
            replace.pop();
        }
    }

    let keypair_bytes: Vec<u8> = replace
        .split(' ')
        .take(KEYPAIR_LENGTH)
        .map(|x| u8::from_str(x).unwrap())
        .collect();

    Keypair::from_bytes(keypair_bytes.as_ref()).unwrap()
}

#[tokio::main]
async fn main() {
    let rpc_client = RpcClient::new("https://api.mainnet-beta.solana.com");

    let keypair = load_keypair("/Users/hoak/Documents/desktop-backup/friendzy-bot.json");

    // stacc's mint and pubkey
    let id = 1436880221354045450;
    let _ = Pubkey::from_str("Gf3sbc5Jb62jH7WcTr3WSNGDQLk1w6wcKMZXKK1SC1E6").unwrap();

    let (bank, _) = derive_bank_address();
    let (mint, _) = derive_mint_address(id);
    let (config, _) = derive_config_address(id);

    // if we use stacc's pubkey to derive the profile it fails with incorrect pubkey ??
    let (profile, _) = derive_profile_address(id, &keypair.pubkey());
    let (metadata, _) = derive_metadata_address(&mint);

    let token_account = get_associated_token_address(&keypair.pubkey(), &mint);

    let ix = swap(
        &keypair.pubkey(),
        &bank,
        &config,
        &mint,
        &profile,
        &metadata,
        &token_account,
        false,
        id,
        1_000_000_000,
        100_000_000,
        Side::Buy,
    );

    println!("{:?}", ix);

    let ixs = [
        create_associated_token_account_idempotent(
            &keypair.pubkey(),
            &keypair.pubkey(),
            &mint,
            &spl_token::id(),
        ),
        ix
    ];
    let blockhash = rpc_client.get_latest_blockhash().unwrap();

    let message = Message::new(&ixs, Some(&keypair.pubkey()));
    let mut tx = Transaction::new_unsigned(message);
    tx.partial_sign(&[&keypair], blockhash);

    rpc_client.send_and_confirm_transaction(&tx).unwrap();

    let account_data = rpc_client.get_account_data(&profile).unwrap();
    let profile_state = Profile::try_from_slice(&account_data).unwrap();

    println!("{:?}", profile_state);  

}