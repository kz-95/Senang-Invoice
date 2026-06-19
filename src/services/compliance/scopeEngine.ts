export function checkScope({ annualTurnover, inCorporateGroup }: { annualTurnover: number; inCorporateGroup: boolean }) {
  if (inCorporateGroup) return { inScope: true, reason: 'Part of a RM1m+ corporate group - group rules apply.' }
  if (annualTurnover >= 1_000_000) return { inScope: true, reason: 'Annual turnover is RM1,000,000 or more.' }
  return { inScope: false, reason: 'Under RM1,000,000 and standalone - permanently exempt (voluntary opt-in allowed).' }
}
