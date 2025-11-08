import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency } from '@/contexts/CurrencyContext';

export function CurrencySelector() {
  const { currency, setCurrency, availableCurrencies, loading } = useCurrency();

  if (loading || availableCurrencies.length === 0) {
    return null;
  }

  return (
    <Select value={currency} onValueChange={setCurrency}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Currency" />
      </SelectTrigger>
      <SelectContent>
        {availableCurrencies.map((curr) => (
          <SelectItem key={curr.code} value={curr.code}>
            {curr.symbol} {curr.code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
