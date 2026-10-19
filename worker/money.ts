import Decimal from "decimal.js";

const Money = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });
export function money(value: unknown): string {
  if (typeof value !== "string" || !/^(0|[1-9]\d{0,12})(\.\d{1,2})?$/.test(value)) throw new Error("invalid_money");
  return new Money(value).toFixed(2);
}
export function totals(items: { unitPrice: string; quantity: number }[]) {
  const total = items.reduce((sum, item) => sum.plus(new Money(money(item.unitPrice)).times(item.quantity)), new Money(0));
  const deposit = total.div(2).toDecimalPlaces(2);
  return { total: total.toFixed(2), deposit: deposit.toFixed(2), remaining: total.minus(deposit).toFixed(2) };
}
export function lineTotal(price: string, quantity: number) { return new Money(money(price)).times(quantity).toFixed(2); }
// Pancake documents integer VND prices. Emit exact JSON numeric literals, never floating-point conversions.
export function integerVnd(value: string): string {
  const normalized = money(value);
  if (!normalized.endsWith(".00")) throw new Error("fractional_vnd_unsupported");
  return normalized.slice(0, -3);
}
