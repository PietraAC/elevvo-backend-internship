type DecimalLike = { toFixed(fractionDigits?: number): string };

export const moneyToString = (value: DecimalLike): string => value.toFixed(2);

export const dateToString = (value: Date): string => value.toISOString();
