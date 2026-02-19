import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';

interface CurrencyConfig {
  code: string;
  symbol: string;
  rate: number;
  name: string;
}

interface CurrencyContextType {
  currency: string;
  currencies: Record<string, CurrencyConfig>;
  setCurrency: (code: string) => void;
  formatCurrency: (amountMXN: number | undefined | null) => string;
  formatCompactCurrency: (amountMXN: number) => string;
  formatExactCurrency: (amountMXN: number) => string;
  formatChartValue: (amountMXN: number) => string;
  convertAmount: (amountMXN: number) => number;
}

const CURRENCY_STORAGE_KEY = 'movicar-currency';

const CURRENCIES: Record<string, CurrencyConfig> = {
  MXN: { code: 'MXN', symbol: '$', rate: 1, name: 'Peso Mexicano' },
  USD: { code: 'USD', symbol: 'US$', rate: 0.058, name: 'Dólar Americano' },
  EUR: { code: 'EUR', symbol: '€', rate: 0.053, name: 'Euro' },
  COP: { code: 'COP', symbol: 'COL$', rate: 228, name: 'Peso Colombiano' },
  BRL: { code: 'BRL', symbol: 'R$', rate: 0.29, name: 'Real Brasileño' },
  GBP: { code: 'GBP', symbol: '£', rate: 0.046, name: 'Libra Esterlina' },
};

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'MXN',
  currencies: CURRENCIES,
  setCurrency: () => {},
  formatCurrency: () => '$0.00 MXN',
  formatCompactCurrency: () => '$0 MXN',
  formatExactCurrency: () => '$0.00 MXN',
  formatChartValue: () => '$0',
  convertAmount: (v) => v,
});

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<string>(() => {
    const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
    return saved && CURRENCIES[saved] ? saved : 'MXN';
  });

  useEffect(() => {
    localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
  }, [currency]);

  const setCurrency = useCallback((code: string) => {
    if (CURRENCIES[code]) {
      setCurrencyState(code);
    }
  }, []);

  const convertAmount = useCallback((amountMXN: number): number => {
    return amountMXN * CURRENCIES[currency].rate;
  }, [currency]);

  const formatCurrency = useCallback((amountMXN: number | undefined | null): string => {
    if (amountMXN === undefined || amountMXN === null || isNaN(amountMXN)) {
      return `${CURRENCIES[currency].symbol}0.00 ${currency}`;
    }
    const converted = amountMXN * CURRENCIES[currency].rate;
    const sym = CURRENCIES[currency].symbol;
    const formatted = new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted);
    return `${sym}${formatted} ${currency}`;
  }, [currency]);

  const formatCompactCurrency = useCallback((amountMXN: number): string => {
    const converted = amountMXN * CURRENCIES[currency].rate;
    const sym = CURRENCIES[currency].symbol;
    const abs = Math.abs(converted);

    let value: string;
    if (abs >= 1_000_000_000) {
      value = `${sym}${(converted / 1_000_000_000).toFixed(1)}B`;
    } else if (abs >= 1_000_000) {
      value = `${sym}${(converted / 1_000_000).toFixed(1)}M`;
    } else {
      value = `${sym}${converted.toLocaleString('es-MX', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`;
    }
    return `${value} ${currency}`;
  }, [currency]);

  const formatExactCurrency = useCallback((amountMXN: number): string => {
    const converted = amountMXN * CURRENCIES[currency].rate;
    const sym = CURRENCIES[currency].symbol;
    return `${sym}${converted.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${currency}`;
  }, [currency]);

  const formatChartValue = useCallback((amountMXN: number): string => {
    const converted = amountMXN * CURRENCIES[currency].rate;
    const sym = CURRENCIES[currency].symbol;
    if (Math.abs(converted) >= 1_000_000) {
      return `${sym}${(converted / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(converted) >= 1_000) {
      return `${sym}${(converted / 1_000).toFixed(1)}k`;
    }
    return `${sym}${converted.toFixed(0)}`;
  }, [currency]);

  const contextValue = useMemo(
    () => ({
      currency,
      currencies: CURRENCIES,
      setCurrency,
      formatCurrency,
      formatCompactCurrency,
      formatExactCurrency,
      formatChartValue,
      convertAmount,
    }),
    [currency, setCurrency, formatCurrency, formatCompactCurrency, formatExactCurrency, formatChartValue, convertAmount]
  );

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
};
