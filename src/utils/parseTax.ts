function parseTax(tax: string): number {
  const pattern = /(\d+(?:\.\d+)?)%/;
  const match = tax.match(pattern);
  const taxNumber = match?.[1] || null;
  return taxNumber === null ? 0 : parseFloat(taxNumber);
}

export default parseTax;
