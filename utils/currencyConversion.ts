import { COMMON_CURRENCIES, CurrencyCode, ExchangeRates, CurrencyInfo } from '../types/receipts';

/**
 * ReceiptVault currency engine.
 *
 * Rates are stored as "units of currency per 1 unit of the home currency".
 * For a home currency of USD: rates.JPY = 157.2 means 1 USD = 157.2 JPY.
 *
 * To convert an amount FROM some currency INTO the home currency:
 *   homeAmount = amount / rates[currency]
 *
 * The home currency always has an implicit rate of 1.
 */

export function getCurrencyInfo(code: CurrencyCode): CurrencyInfo {
  const found = COMMON_CURRENCIES.find((c) => c.code === code);
  if (found) return found;
  return { code, symbol: code, name: code };
}

export function getCurrencySymbol(code: CurrencyCode): string {
  return getCurrencyInfo(code).symbol;
}

/**
 * Convert an amount in `fromCurrency` to the home currency.
 */
export function convertToHome(
  amount: number,
  fromCurrency: CurrencyCode,
  homeCurrency: CurrencyCode,
  rates: ExchangeRates
): number {
  if (fromCurrency === homeCurrency) return amount;

  const rate = rates[fromCurrency];
  if (!rate || rate <= 0) {
    // Unknown rate — fall back to 1:1 so the value is never silently dropped.
    return amount;
  }

  return amount / rate;
}

/**
 * Convert between two arbitrary currencies via the home base.
 */
export function convertBetween(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  rates: ExchangeRates
): number {
  if (fromCurrency === toCurrency) return amount;

  const fromRate = fromCurrency === 'USD' ? (rates.USD ?? 1) : (rates[fromCurrency] ?? 1);
  const toRate = rates[toCurrency] ?? 1;

  // amount in "home" units, then to target.
  const inHome = amount / (fromRate || 1);
  return inHome * (toRate || 1);
}

/**
 * Format a money amount with the appropriate currency symbol.
 * JPY / KRW are whole-number currencies; others show 2 decimals.
 */
export function formatMoney(amount: number, currency: CurrencyCode): string {
  const symbol = getCurrencySymbol(currency);
  const noDecimals = currency === 'JPY' || currency === 'KRW';

  const value = noDecimals
    ? Math.round(amount).toLocaleString('en-US')
    : amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

  return `${symbol}${value}`;
}

/**
 * Round to 2 decimal places (cents).
 */
export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}
