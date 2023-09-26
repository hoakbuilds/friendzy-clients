use anchor_lang::{
    prelude::*,
    solana_program::{instruction::Instruction, system_program, sysvar::SysvarId},
};
use anchor_spl::{associated_token, token::spl_token};

#[derive(Debug, Default, Clone, PartialEq)]
pub struct VerifyArgs {
    pub id: u64,
    pub owner: Pubkey,
}

impl VerifyArgs {
    pub const LEN: usize = 42;
    pub const VERSION_INDEX: usize = 0;
    pub const ID_INDEX: usize = 1;
    pub const PADDING_INDEX: usize = 9;
    pub const OWNER_INDEX: usize = 10;

    pub fn try_from_slice(data: &[u8]) -> Result<Self> {
        if data.len() != Self::LEN {
            return Err(ProgramError::InvalidInstructionData.into());
        }

        let id = u64::try_from_slice(&data[Self::ID_INDEX..Self::PADDING_INDEX]).unwrap();
        let owner = Pubkey::try_from_slice(&data[Self::OWNER_INDEX..]).unwrap();

        Ok(Self { id, owner })
    }
}

#[derive(Debug, Default, Clone, PartialEq)]
pub struct WithdrawArgs {
    pub id: u64,
}

impl WithdrawArgs {
    pub const LEN: usize = 10;
    pub const VERSION_INDEX: usize = 0;
    pub const ID_INDEX: usize = 1;
    pub const PADDING_INDEX: usize = 9;

    pub fn try_from_slice(data: &[u8]) -> Result<Self> {
        if data.len() != Self::LEN {
            return Err(ProgramError::InvalidInstructionData.into());
        }
        let id = u64::try_from_slice(&data[Self::ID_INDEX..Self::PADDING_INDEX]).unwrap();

        Ok(Self { id })
    }
}

#[derive(Debug, Default, Clone, PartialEq)]
pub struct SwapArgs {
    pub id: u64,
    pub side: Side,
    pub amount: u64,
    pub price: u64,
}

impl SwapArgs {
    pub const LEN: usize = 26;
    pub const VERSION_INDEX: usize = 0;
    pub const ID_INDEX: usize = 1;
    pub const SIDE_INDEX: usize = 9;
    pub const AMOUNT_INDEX: usize = 10;
    pub const PRICE_INDEX: usize = 18;

    pub fn try_from_slice(data: &[u8]) -> Result<Self> {
        if data.len() != Self::LEN {
            return Err(ProgramError::InvalidInstructionData.into());
        }
        let id = u64::try_from_slice(&data[Self::ID_INDEX..Self::SIDE_INDEX]).unwrap();
        let side = Side::try_from_slice(&data[Self::SIDE_INDEX..Self::AMOUNT_INDEX]).unwrap();
        let amount = u64::try_from_slice(&data[Self::AMOUNT_INDEX..Self::PRICE_INDEX]).unwrap();
        let price = u64::try_from_slice(&data[Self::PRICE_INDEX..]).unwrap();

        Ok(Self {
            id,
            side,
            amount,
            price,
        })
    }
}

#[derive(Debug, Default, Clone, Copy, PartialEq, AnchorSerialize, AnchorDeserialize)]
#[repr(u8)]
pub enum Side {
    #[default]
    Default,
    Buy = 1,
    Sell = 2,
}

pub async fn swap(
    user: &Pubkey,
    bank: &Pubkey,
    config: &Pubkey,
    token_mint: &Pubkey,
    profile: &Pubkey,
    metadata: &Pubkey,
    token_account: &Pubkey,
    first_purchase: bool,
    id: u64,
    amount: u64,
    price: u64,
    side: Side,
) -> Instruction {
    let mut accounts = vec![
        AccountMeta::new(*user, true),                        // 0 - user
        AccountMeta::new(*bank, false),                       // 1 - bank
        AccountMeta::new(*profile, false),                    // 2 - config
        AccountMeta::new(*token_mint, false),                 // 3 - token mint
        AccountMeta::new(*config, false),                     // 4 - profile
        AccountMeta::new_readonly(spl_token::id(), false),    // 5 - spl token program
        AccountMeta::new_readonly(Rent::id(), false),         // 6 - rent
        AccountMeta::new_readonly(system_program::ID, false), // 7 - system program
    ];

    if first_purchase {
        accounts.extend(vec![
            AccountMeta::new(*metadata, false), // 8 - metadata account
            AccountMeta::new_readonly(mpl_token_metadata::ID, false), // 9 - metaplex program
            AccountMeta::new(*token_account, false), // 10 - token account
        ])
    } else {
        accounts.extend(vec![
            AccountMeta::new_readonly(system_program::ID, false), // 8 - placeholder
            AccountMeta::new_readonly(system_program::ID, false), // 9 - placeholder
            AccountMeta::new_readonly(system_program::ID, false), // 10 - placeholder
        ])
    }

    accounts.extend(vec![
        AccountMeta::new(crate::vault::id(), false), // 11 - team vault most likely
        AccountMeta::new_readonly(associated_token::ID, false), // 12 - ata program
    ]);

    Instruction {
        program_id: crate::id(),
        accounts,
        data: create_swap_instruction_data(id, amount, price, side),
    }
}

pub async fn withdraw(
    user: &Pubkey,
    bank: &Pubkey,
    config: &Pubkey,
    token_mint: &Pubkey,
    profile: &Pubkey,
    id: u64,
) -> Instruction {
    Instruction {
        program_id: crate::id(),
        accounts: vec![
            AccountMeta::new(*user, true),                        // 0 - user
            AccountMeta::new(*bank, false),                       // 1 - bank
            AccountMeta::new(*profile, false),                    // 2 - config
            AccountMeta::new(*token_mint, false),                 // 3 - token mint
            AccountMeta::new(*config, false),                     // 4 - profile
            AccountMeta::new_readonly(spl_token::id(), false),    // 5 - spl token program
            AccountMeta::new_readonly(Rent::id(), false),         // 6 - rent
            AccountMeta::new_readonly(system_program::ID, false), // 7 - system program
            AccountMeta::new_readonly(system_program::ID, false), // 8 - placeholder
            AccountMeta::new_readonly(system_program::ID, false), // 9 - placeholder
            AccountMeta::new_readonly(system_program::ID, false), // 10 - placeholder
        ],
        data: create_withdraw_instruction_data(id),
    }
}

/// Creates a "swap" instruction.
/// Buy: [0, id, 1, amount, max_price]
/// Sell: [0, id, 2, amount, min_price]
fn create_swap_instruction_data(id: u64, amount: u64, price: u64, side: Side) -> Vec<u8> {
    // 0 - optional
    // 1 - twitter/x user_id that is commonly found in the API responses
    // 9 - the side, either `Default` = 0 | `Buy` = 1 | `Sell` = 2 with u8 alignment or sell
    // 10 - the amount of keys to buy, this is denominated in native units
    // 18 - the price, !!!!! IMPORTANT !!!!! this will be `max_price` for Side == Side::Buy otherwise
    // 26 - !!!!! IMPORTANT !!!!! there appears to be another number at the end of the instruction but we don't use it
    [
        vec![0],
        id.try_to_vec().unwrap_or_default(),
        side.try_to_vec().unwrap_or_default(),
        amount.try_to_vec().unwrap_or_default(),
        price.try_to_vec().unwrap_or_default(),
    ]
    .concat()
}

/// Withdraw: [0, id, 3]
fn create_withdraw_instruction_data(id: u64) -> Vec<u8> {
    // 0 - optional
    // 1 - twitter/x user_id that is commonly found in the API responses
    // 9 - instruction
    [vec![0], id.try_to_vec().unwrap_or_default(), vec![3]].concat()
}

/// Verify: [0, id, 0, owner]
fn create_verify_instruction_data(owner: &Pubkey, id: u64) -> Vec<u8> {
    // 0 - optional
    // 1 - twitter/x user_id
    // 9 - instruction
    // 10 - owner
    [
        vec![0],
        id.try_to_vec().unwrap_or_default(),
        vec![0],
        owner.try_to_vec().unwrap_or_default(),
    ]
    .concat()
}

#[cfg(test)]
mod tests {
    use std::str::FromStr;

    use super::*;
    use base64::{engine::general_purpose, Engine};

    fn decode_base64(data: &str) -> Vec<u8> {
        general_purpose::STANDARD.decode(data).unwrap()
    }

    #[test]
    fn test_create_swap_instruction() -> Result<()> {
        let data = decode_base64("AACg11IlVCEQAQDkC1QCAAAAlsmCHAAAAAA=");
        println!("data: {:?} - len: {}", data, data.len());
        let swap_args = SwapArgs::try_from_slice(&data).unwrap();
        assert_eq!(1_162_302_698_118_684_672, swap_args.id);
        assert_eq!(10000000000, swap_args.amount);
        assert_eq!(Side::Buy, swap_args.side);
        assert_eq!(478333334, swap_args.price);

        let ix_data = create_swap_instruction_data(
            1_162_302_698_118_684_672,
            10000000000,
            478333334,
            Side::Buy,
        );
        assert_eq!(data, ix_data);

        Ok(())
    }

    #[test]
    fn test_buy_instruction_data() -> Result<()> {
        let data = decode_base64("AACg11IlVCEQAQDkC1QCAAAAlsmCHAAAAAA=");
        println!("data: {:?}", data);
        let swap_args = SwapArgs::try_from_slice(&data).unwrap();
        assert_eq!(1_162_302_698_118_684_672, swap_args.id);
        assert_eq!(10000000000, swap_args.amount);
        assert_eq!(Side::Buy, swap_args.side);
        assert_eq!(478333334, swap_args.price);

        let ix_data = create_swap_instruction_data(
            1_162_302_698_118_684_672,
            10000000000,
            478333334,
            Side::Buy,
        );
        assert_eq!(data, ix_data);

        Ok(())
    }

    #[test]
    fn test_sell_instruction_data() -> Result<()> {
        let data = decode_base64("AACg11IlVCEQAgB0O6QLAAAAZcBHDgAAAAA=");
        println!("data: {:?}", data);
        let swap_args = SwapArgs::try_from_slice(&data).unwrap();
        assert_eq!(1_162_302_698_118_684_672, swap_args.id);
        assert_eq!(50000000000, swap_args.amount);
        assert_eq!(Side::Sell, swap_args.side);
        assert_eq!(239583333, swap_args.price);

        let ix_data = create_swap_instruction_data(
            1_162_302_698_118_684_672,
            10000000000,
            239583333,
            Side::Sell,
        );
        assert_ne!(data, ix_data);

        let ix_data = create_swap_instruction_data(
            1_162_302_698_118_684_672,
            50000000000,
            478333334,
            Side::Sell,
        );
        assert_ne!(data, ix_data);

        let ix_data = create_swap_instruction_data(
            1_162_302_698_118_684_672,
            50000000000,
            239583333,
            Side::Sell,
        );
        assert_eq!(data, ix_data);
        Ok(())
    }

    #[test]
    fn test_withdraw_instruction_data() -> Result<()> {
        let data = decode_base64("AACg11IlVCEQAw==");
        println!("data: {:?}", data);
        let withdraw_args = WithdrawArgs::try_from_slice(&data).unwrap();
        assert_eq!(1162302698118684672, withdraw_args.id);

        let ix_data = create_withdraw_instruction_data(1_011_079_790);
        assert_ne!(data, ix_data);

        let ix_data = create_withdraw_instruction_data(1162302698118684672);
        assert_eq!(data, ix_data);
        Ok(())
    }

    #[test]
    fn test_verify_instruction_data() -> Result<()> {
        let data = decode_base64("AACg11IlVCEQAApz5x/t0hNl7QruhPzk4rIGR/001ey9oRXwI9JjP4d4");
        let owner = Pubkey::from_str("hoakwpFB8UoLnPpLC56gsjpY7XbVwaCuRQRMQzN5TVh").unwrap();
        println!("data: {:?}", data);
        let withdraw_args = VerifyArgs::try_from_slice(&data).unwrap();
        assert_eq!(1162302698118684672, withdraw_args.id);
        assert_eq!(owner, withdraw_args.owner);

        let ix_data = create_verify_instruction_data(&owner, 1_011_079_790);
        assert_ne!(data, ix_data);

        let ix_data = create_verify_instruction_data(&owner, 1162302698118684672);
        assert_eq!(data, ix_data);
        Ok(())
    }

    #[test]
    fn test_verify_instruction_data2() -> Result<()> {
        let data = decode_base64("AAEwV+3E1rcUABc2N6w6zn3XiRhCfgjWLoFVBsLHDeU6zOoel4mAxqIw");
        let owner = Pubkey::from_str("2ZcKytTHy1vRQoB1L8eCG7zxwEF4HVURnzqby3uQpW2T").unwrap();
        println!("data: {:?}", data);
        let withdraw_args = VerifyArgs::try_from_slice(&data).unwrap();
        assert_eq!(1492897942780456961, withdraw_args.id);
        assert_eq!(owner, withdraw_args.owner);

        let ix_data = create_verify_instruction_data(&owner, 1_011_079_790);
        assert_ne!(data, ix_data);

        let ix_data = create_verify_instruction_data(&owner, 1492897942780456961);
        assert_eq!(data, ix_data);
        Ok(())
    }
}
