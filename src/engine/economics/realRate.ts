/** Fisher: real return from nominal return and inflation (decimals). */
export function realRate(nominal: number, inflation: number): number {
  return (1 + nominal) / (1 + inflation) - 1;
}
