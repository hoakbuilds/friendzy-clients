use anchor_lang::prelude::*;

// Config: [id, supply, owner, royalties, unclaimed, debt]
// Profile: [id, owner, buy_amount, sell_amount, buy_volume, sell_volume, reserved]
// All u64 except owner which are pubkeys

#[derive(Debug, Default, Clone, PartialEq, AnchorSerialize, AnchorDeserialize)]
pub struct Config {
    pub id: u64,
    pub supply: u64,
    pub owner: Pubkey,
    pub royalties: u64,
    pub unclaimed: u64,
    pub debt: u64,
}

#[derive(Debug, Default, Clone, PartialEq, AnchorSerialize, AnchorDeserialize)]
pub struct Profile {
    pub id: u64,
    pub owner: Pubkey,
    pub buy_amount: u64,
    pub sell_amount: u64,
    pub buy_volume: u64,
    pub sell_volume: u64,
    pub reserved: u64,
}

#[cfg(test)]
mod tests {
    use base64::{engine::general_purpose, Engine};

    use super::*;
    use std::str::FromStr;

    fn decode_base64(data: &str) -> Vec<u8> {
        general_purpose::STANDARD.decode(data).unwrap()
    }

    #[test]
    fn test_load_config() -> Result<()> {
        let data = decode_base64("AKDXUiVUIRAALr5DLwAAAApz5x/t0hNl7QruhPzk4rIGR/001ey9oRXwI9JjP4d4QBxARgAAAAApndAJAAAAAAAAAAAAAAAA");

        let config = Config::try_from_slice(&data).unwrap();

        assert_eq!(
            Pubkey::from_str("hoakwpFB8UoLnPpLC56gsjpY7XbVwaCuRQRMQzN5TVh").unwrap(),
            config.owner
        );
        assert_eq!(1_162_302_698_118_684_672, config.id);
        assert_eq!(203000000000, config.supply);
        assert_eq!(1178606656, config.royalties);
        assert_eq!(164666665, config.unclaimed);
        assert_eq!(0, config.debt);

        println!("{:?}", config);

        Ok(())
    }

    #[test]
    fn test_load_profile() -> Result<()> {
        let data = decode_base64("AKDXUiVUIRAKc+cf7dITZe0K7oT85OKyBkf9NNXsvaEV8CPSYz+HeAC4mj4KAAAAAAAAAAAAAADLyIBbAAAAAAAAAAAAAAAAAAAAAAAAAAA=");

        let profile = Profile::try_from_slice(&data).unwrap();

        assert_eq!(
            Pubkey::from_str("hoakwpFB8UoLnPpLC56gsjpY7XbVwaCuRQRMQzN5TVh").unwrap(),
            profile.owner
        );
        assert_eq!(1_162_302_698_118_684_672, profile.id);
        assert_eq!(44000000000, profile.buy_amount);
        assert_eq!(1535166667, profile.buy_volume);
        assert_eq!(0, profile.sell_amount);
        assert_eq!(0, profile.sell_volume);

        Ok(())
    }
}
