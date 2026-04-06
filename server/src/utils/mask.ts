export const maskToken = (token: string): string => {
  if (!token || token.length < 4) {
    return '****';
  }
  const last4 = token.slice(-4);
  return `sk-...${last4}`;
};

export const maskAccountId = (accountId: string): string => {
  if (!accountId || accountId.length < 8) {
    return '****';
  }
  const first4 = accountId.slice(0, 4);
  const last4 = accountId.slice(-4);
  return `${first4}...${last4}`;
};
