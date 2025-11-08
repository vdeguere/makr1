import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_CURRENCY, Currency, formatPrice, convertPrice } from '@/lib/currency';

interface CurrencyContextType {
  currency: string;
  setCurrency: (code: string) => void;
  formatPrice: (amount: number | null | undefined, currency?: string) => string;
  convertPrice: (amount: number, from: string, to: string) => number;
  availableCurrencies: Currency[];
  exchangeRates: Record<string, number>;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<string>(() => {
    // Try to get from localStorage first
    return localStorage.getItem('preferred_currency') || DEFAULT_CURRENCY;
  });
  
  const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>([]);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Fetch available currencies and exchange rates
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const { data, error } = await supabase
          .from('currency_settings')
          .select('*')
          .eq('is_active', true)
          .order('is_default', { ascending: false });

        if (error) throw error;

        if (data) {
          const currencies: Currency[] = data.map(c => ({
            code: c.currency_code,
            symbol: c.symbol,
            name: c.display_name,
            exchangeRate: c.exchange_rate_to_base,
          }));

          setAvailableCurrencies(currencies);

          const rates: Record<string, number> = {};
          data.forEach(c => {
            rates[c.currency_code] = c.exchange_rate_to_base;
          });
          setExchangeRates(rates);
        }
      } catch (error) {
        console.error('Error fetching currencies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrencies();
  }, []);

  // Update user preference when currency changes
  const setCurrency = async (code: string) => {
    setCurrencyState(code);
    localStorage.setItem('preferred_currency', code);

    // Update in profile if user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ preferred_currency: code })
        .eq('id', user.id);
    }
  };

  // Load user preference from profile on auth
  useEffect(() => {
    if (preferencesLoaded) return;

    const loadUserPreference = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('preferred_currency')
            .eq('id', user.id)
            .maybeSingle();

          if (data?.preferred_currency) {
            setCurrencyState(data.preferred_currency);
            localStorage.setItem('preferred_currency', data.preferred_currency);
          }
        }
      } catch (error) {
        console.error('Error loading user currency preference:', error);
      } finally {
        setPreferencesLoaded(true);
      }
    };

    loadUserPreference();
  }, []);

  const formatPriceWithContext = (amount: number | null | undefined, currencyOverride?: string) => {
    return formatPrice(amount, currencyOverride || currency);
  };

  const convertPriceWithContext = (amount: number, from: string, to: string) => {
    return convertPrice(amount, from, to, exchangeRates);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatPrice: formatPriceWithContext,
        convertPrice: convertPriceWithContext,
        availableCurrencies,
        exchangeRates,
        loading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
