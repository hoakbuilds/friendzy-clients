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

/// The denominator for decimal conversions.
pub const DECIMAL_DENOMINATOR: u64 = 1_000_000_000;

/// The initial point in the curve.
const INITIAL_POINT: f64 = 59_500_000_000.0;

/// The curve exponent.
const CURVE_EXPONENT: f64 = 2.0;

/// The denominator for the curve exponentiation.
///
/// Converted for key decimals this represents 12_000.
const CURVE_DENOMINATOR: f64 = 12_000_000_000_000.0;

/// The function used to calculate points in the curve.
fn curve(point: f64) -> f64 {
    (INITIAL_POINT + point).powf(CURVE_EXPONENT) / CURVE_DENOMINATOR
}

pub fn calculate_price(supply: u64) -> u64 {
    (curve((supply + DECIMAL_DENOMINATOR) as f64) - curve(supply as f64)) as u64
}

pub fn calculate_price_ui(supply: f64) -> f64 {
    calculate_price(supply as u64) as f64 / DECIMAL_DENOMINATOR as f64
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    pub fn test_calculate_price_zero_supply() -> Result<()> {
        let price = calculate_price(0);
        assert_eq!(price, 10_000_000);
        Ok(())
    }

    #[test]
    pub fn test_calculate_price_one_supply() -> Result<()> {
        let price = calculate_price(1_000_000_000);
        assert_eq!(price, 10166666);
        Ok(())
    }

    #[test]
    pub fn test_calculate_price_zero_supply_ui() -> Result<()> {
        let price = calculate_price_ui(0f64);
        assert_eq!(price, 0.01);
        Ok(())
    }

    #[test]
    pub fn test_calculate_price_one_supply_ui() -> Result<()> {
        let price = calculate_price_ui(1_000_000_000f64);
        assert_eq!(price, 0.010166666);
        Ok(())
    }
}
