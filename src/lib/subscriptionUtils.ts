export function calculateSubscriptionPrice(
  retailPrice: number,
  discountPercentage: number
): number {
  const discount = (retailPrice * discountPercentage) / 100;
  return retailPrice - discount;
}

export function formatSubscriptionSavings(
  retailPrice: number,
  discountPercentage: number,
  currencySymbol: string = '฿'
): string {
  const savings = (retailPrice * discountPercentage) / 100;
  return `Save ${currencySymbol}${savings.toFixed(2)}`;
}
