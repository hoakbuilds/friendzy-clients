use anchor_lang::{
    prelude::*,
    solana_program::{instruction::Instruction, system_program, sysvar::SysvarId},
};
use anchor_spl::{associated_token, token::spl_token};

#[derive(Debug, Default, Clone, PartialEq, AnchorSerialize, AnchorDeserialize)]
pub struct SwapArgs {
    data: Vec<u8>,

    bump: u8,
    pub id: u64,
    pub side: Side,
    pub amount: u64,
    pub price: u64,
}

impl SwapArgs {
    // These are buy/sell ix:
    // Buy: [0, id, 1, amount, max_price]
    // Sell: [0, id, 2, amount, min_price]
    pub const LEN: usize = 26;
    pub const BUMP_OFFSET: usize = 0;
    pub const ID_OFFSET: usize = 1;
    pub const SIDE_OFFSET: usize = 9;
    pub const AMOUNT_OFFSET: usize = 10;
    pub const PRICE_OFFSET: usize = 18;

    pub fn try_from_slice(data: &[u8]) -> Self {
        let bump = u8::try_from_slice(&data[Self::BUMP_OFFSET..Self::ID_OFFSET]).unwrap();
        let id = u64::try_from_slice(&data[Self::ID_OFFSET..Self::SIDE_OFFSET]).unwrap();
        let side = Side::try_from_slice(&data[Self::SIDE_OFFSET..Self::AMOUNT_OFFSET]).unwrap();
        let amount = u64::try_from_slice(&data[Self::AMOUNT_OFFSET..Self::PRICE_OFFSET]).unwrap();
        let price = u64::try_from_slice(&data[Self::PRICE_OFFSET..Self::LEN]).unwrap();
        Self {
            data: data.to_vec(),
            bump,
            id,
            side,
            amount,
            price,
        }
    }

    pub fn to_vec(&self) -> Vec<u8> {
        create_swap_instruction_data(self.id, self.amount, self.price, self.side)
    }

    pub fn bump(&self) -> u8 {
        self.bump
    }

    pub fn id(&self) -> u64 {
        self.id
    }

    pub fn side(&self) -> Side {
        self.side
    }

    pub fn amount(&self) -> u64 {
        self.amount
    }

    pub fn price(&self) -> u64 {
        self.price
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
) -> Result<Instruction> {
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

    Ok(Instruction {
        program_id: crate::id(),
        accounts: accounts,
        data: create_swap_instruction_data(id, amount, price, side),
    })
}

fn create_swap_instruction_data(id: u64, amount: u64, price: u64, side: Side) -> Vec<u8> {
    let mut data = Vec::new();
    data.push(0); // offset 0
    data.extend(id.to_le_bytes()); // 1
    side.serialize(&mut data).unwrap(); // offset 9
    data.extend(amount.to_le_bytes()); // 10
    data.extend(price.to_le_bytes()); // 18
    data
}

#[cfg(test)]
mod tests {
    use super::*;
    use base64::{engine::general_purpose, Engine};

    fn decode_base64(data: &str) -> Vec<u8> {
        general_purpose::STANDARD.decode(data).unwrap()
    }

    #[test]
    fn test_create_swap_instruction() -> Result<()> {
        let buy_data_10_fren = decode_base64("AACg11IlVCEQAQDkC1QCAAAAlsmCHAAAAAA=");
        let swap_args = SwapArgs::try_from_slice(&buy_data_10_fren);
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
        assert_eq!(buy_data_10_fren, ix_data);

        Ok(())
    }

    #[test]
    fn test_buy_instruction_data() -> Result<()> {
        let buy_data_10_fren = decode_base64("AACg11IlVCEQAQDkC1QCAAAAlsmCHAAAAAA=");
        let swap_args = SwapArgs::try_from_slice(&buy_data_10_fren);
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
        assert_eq!(buy_data_10_fren, ix_data);

        Ok(())
    }

    #[test]
    fn test_sell_instruction_data() -> Result<()> {
        let data = decode_base64("AACg11IlVCEQAgB0O6QLAAAAZcBHDgAAAAA=");
        let swap_args = SwapArgs::try_from_slice(&data);
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
}
