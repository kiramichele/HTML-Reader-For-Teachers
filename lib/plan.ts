// Plan constants — pure values, safe to import from client components (no SDKs).
//
// The free trial is usage-based: this many AI generations (incl. regenerations)
// are free, then a subscription is required. Bounds free Anthropic cost per
// teacher precisely (a time-based trial doesn't). Tune freely.
export const FREE_GENERATIONS = 25;
export const PRICE_LABEL = "$10 / month";
