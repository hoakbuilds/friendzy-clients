use anchor_lang::prelude::*;

mod instructions;
mod pda;
mod state;

pub use instructions::*;
pub use pda::*;
pub use state::*;

declare_id!("FrenAezyygcqNKaCkYNzBAxTCo717wh1bgnKLqnxP8Cq");

pub mod vault {
    use super::*;

    declare_id!("Fr3nGzsEefxDV5auZeiQVFeHj2NhSgvqztdLBYpsob5e");
}

/// Encodes a string into an array of bytes fixed with 32 length.
#[inline(always)]
pub fn encode_string(alias: &str) -> [u8; 32] {
    let mut encoded = [0_u8; 32];
    let alias_bytes = alias.as_bytes();
    assert!(alias_bytes.len() <= 32);
    for (i, byte) in alias_bytes.iter().enumerate() {
        encoded[i] = *byte;
    }
    encoded
}

pub fn get_function_hash(namespace: &str, name: &str) -> [u8; 8] {
    let preimage = format!("{}:{}", namespace, name);
    let mut sighash = [0u8; 8];
    sighash.copy_from_slice(
        &anchor_lang::solana_program::hash::hash(preimage.as_bytes()).to_bytes()[..8],
    );
    sighash
}

#[cfg(test)]
mod tests {}
