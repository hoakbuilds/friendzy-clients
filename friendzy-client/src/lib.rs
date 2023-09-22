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

#[cfg(test)]
mod tests {}
