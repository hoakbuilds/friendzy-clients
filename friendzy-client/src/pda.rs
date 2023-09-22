use anchor_lang::prelude::*;

pub fn derive_bank_address() -> (Pubkey, u8) {
    Pubkey::find_program_address(&["bank".as_ref()], &crate::id())
}

pub fn derive_mint_address(id: u64) -> (Pubkey, u8) {
    Pubkey::find_program_address(&["mint".as_ref(), id.to_le_bytes().as_ref()], &crate::id())
}

pub fn derive_profile_address(id: u64, user: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &["config".as_ref(), id.to_le_bytes().as_ref(), user.as_ref()],
        &crate::id(),
    )
}

pub fn derive_config_address(id: u64) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &["config".as_ref(), id.to_le_bytes().as_ref()],
        &crate::id(),
    )
}

pub fn derive_metadata_address(mint: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            "metadata".as_ref(),
            mpl_token_metadata::ID.as_ref(),
            mint.as_ref(),
        ],
        &mpl_token_metadata::ID,
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::str::FromStr;

    #[test]
    fn test_bank_derivation() -> Result<()> {
        // https://solscan.io/tx/xuNbLveFGhwknY12fbnrRhCffaj355LucVEZXoudjxhESB1BVi27Z2bPrqQcZirSHktkCSM3dVqHWrojB8ZyzQk
        let bank_from_instruction =
            Pubkey::from_str("DPVMvgcbmHz1FFFSYtoLSzQgPD59UbMguozL8RVfq5ud").unwrap();
        let (bank, _) = derive_bank_address();

        assert_eq!(bank_from_instruction, bank);

        Ok(())
    }

    #[test]
    fn test_mint_derivation() -> Result<()> {
        // https://solscan.io/tx/xuNbLveFGhwknY12fbnrRhCffaj355LucVEZXoudjxhESB1BVi27Z2bPrqQcZirSHktkCSM3dVqHWrojB8ZyzQk
        let mint_from_instruction =
            Pubkey::from_str("GUZJcmy4QRF3dXWcRxueyPGQfQAmRs1FtqiszRJaFfxV").unwrap();
        let (mint, _) = derive_mint_address(1_162_302_698_118_684_672);

        assert_eq!(mint_from_instruction, mint);

        Ok(())
    }

    #[test]
    fn test_profile_derivation() -> Result<()> {
        // https://solscan.io/tx/xuNbLveFGhwknY12fbnrRhCffaj355LucVEZXoudjxhESB1BVi27Z2bPrqQcZirSHktkCSM3dVqHWrojB8ZyzQk
        let user = Pubkey::from_str("hoakwpFB8UoLnPpLC56gsjpY7XbVwaCuRQRMQzN5TVh").unwrap();
        let profile_from_instruction =
            Pubkey::from_str("74zFAk5CPA9SNmJPD2K7DqS8WMP1cG9G7DbKN1vyYiVd").unwrap();
        let (profile, _) = derive_profile_address(1_162_302_698_118_684_672, &user);

        assert_eq!(profile_from_instruction, profile);

        Ok(())
    }

    #[test]
    fn test_config_derivation() -> Result<()> {
        // https://solscan.io/tx/xuNbLveFGhwknY12fbnrRhCffaj355LucVEZXoudjxhESB1BVi27Z2bPrqQcZirSHktkCSM3dVqHWrojB8ZyzQk
        let config_from_instruction =
            Pubkey::from_str("5Y3ac7p37XtSMmbb84QuP8dZTv3tfuH2pu1Wg6dokwDQ").unwrap();
        let (config, _) = derive_config_address(1_162_302_698_118_684_672);

        assert_eq!(config_from_instruction, config);

        Ok(())
    }

    #[test]
    fn test_metadata_derivation() -> Result<()> {
        // https://solscan.io/tx/xuNbLveFGhwknY12fbnrRhCffaj355LucVEZXoudjxhESB1BVi27Z2bPrqQcZirSHktkCSM3dVqHWrojB8ZyzQk
        let (mint, _) = derive_mint_address(1_162_302_698_118_684_672);
        let metadata_from_instruction =
            Pubkey::from_str("8FQs4Z7HDJG7LetoUkcBAnvEKJZaTNcurzbH6o6sxwPD").unwrap();
        let (metadata, _) = derive_metadata_address(&mint);

        assert_eq!(metadata_from_instruction, metadata);

        Ok(())
    }
}
