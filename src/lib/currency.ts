export interface Currency {
  code: string;
  symbol: string;
  name: string;
  exchangeRate: number;
}

export const DEFAULT_CURRENCY = 'THB';

export const CURRENCIES: Record<string, Omit<Currency, 'exchangeRate'>> = {
  THB: { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
};

export function formatPrice(
  amount: number | null | undefined,
  currency: string = DEFAULT_CURRENCY
): string {
  if (amount === null || amount === undefined) return '-';
  
  const currencyInfo = CURRENCIES[currency] || CURRENCIES[DEFAULT_CURRENCY];
  
  // Format based on currency (JPY doesn't use decimals)
  const decimals = currency === 'JPY' ? 0 : 2;
  
  return `${currencyInfo.symbol}${amount.toFixed(decimals)}`;
}

export function convertPrice(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount;
  
  // Convert to base currency (THB) first
  const baseAmount = amount / (exchangeRates[fromCurrency] || 1);
  
  // Convert to target currency
  return baseAmount * (exchangeRates[toCurrency] || 1);
}

export function getHerbPrice(
  herb: any,
  currency: string = DEFAULT_CURRENCY,
  priceType: 'retail_price' | 'cost_per_unit' = 'retail_price'
): number | null {
  // Check if supported_currencies has the price for this currency
  if (herb.supported_currencies?.[currency]?.[priceType]) {
    return herb.supported_currencies[currency][priceType];
  }
  
  // Fallback to default price
  if (herb.price_currency === currency) {
    return herb[priceType];
  }
  
  // Return null if price not available in requested currency
  return null;
}

export function getCurrencySymbol(currency: string): string {
  return CURRENCIES[currency]?.symbol || currency;
}
