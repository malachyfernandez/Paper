// ============================================================================
// ReceiptVault — Type definitions for the receipt-logging system
// ============================================================================
//
// Built on Paper's userVariables system. All persistent state lives in
// `useUserVariable` (single values: profile, settings) and `useUserList`
// (collections: groups, receipts) keyed per user.
// ============================================================================

// ---------------------------------------------------------------------------
// Currency
// ---------------------------------------------------------------------------

export type CurrencyCode = string; // ISO 4217, e.g. "USD", "JPY", "EUR"

export type CurrencyInfo = {
  code: CurrencyCode;
  symbol: string;
  name: string;
};

// Common currencies used to seed the picker. Rates are user-editable and
// stored separately in settings — these are just display metadata.
export const COMMON_CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
];

// Exchange rates expressed as "units of currency per 1 unit of home currency".
// Example for home=USD: { JPY: 157.2, EUR: 0.92 } means 1 USD = 157.2 JPY.
export type ExchangeRates = Record<CurrencyCode, number>;

// ---------------------------------------------------------------------------
// User profile + settings
// ---------------------------------------------------------------------------

export type ReceiptUserData = {
  name: string;
  email: string;
  userId: string;
  createdAt: number;
};

export type ReceiptSettings = {
  homeCurrency: CurrencyCode;
  // Rates: how many units of the keyed currency equal 1 home-currency unit.
  exchangeRates: ExchangeRates;
  lastRatesUpdate: number;
  // Optional OpenRouter API key for client-side AI receipt scanning. Stored
  // PRIVATE per user; the request is made directly from the client so the key
  // never touches a ReceiptVault/Convex server.
  openRouterKey?: string;
  // Vision model used for scanning. Defaults to a fast, cheap multimodal model.
  aiModel?: string;
};

// Result returned by the AI receipt scanner. All fields optional — the model
// fills in whatever it can read.
export type ReceiptScanResult = {
  merchant?: string;
  amount?: number;
  currency?: CurrencyCode;
  category?: ReceiptCategory;
  purchaseDate?: string;
  purpose?: string;
  notes?: string;
};

export const DEFAULT_AI_MODEL = 'google/gemini-2.0-flash-001';

export const DEFAULT_SETTINGS: ReceiptSettings = {
  homeCurrency: 'USD',
  exchangeRates: {
    USD: 1,
    JPY: 157.2,
    EUR: 0.92,
    GBP: 0.79,
    KRW: 1370.0,
    CNY: 7.24,
    CAD: 1.37,
    AUD: 1.51,
    THB: 36.5,
    INR: 83.4,
  },
  lastRatesUpdate: 0,
};

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export type ReceiptCategory =
  | 'food'
  | 'transport'
  | 'lodging'
  | 'shopping'
  | 'entertainment'
  | 'groceries'
  | 'health'
  | 'business'
  | 'other';

export const CATEGORY_LABELS: Record<ReceiptCategory, string> = {
  food: 'Food & Dining',
  transport: 'Transport',
  lodging: 'Lodging',
  shopping: 'Shopping',
  entertainment: 'Entertainment',
  groceries: 'Groceries',
  health: 'Health',
  business: 'Business',
  other: 'Other',
};

export const CATEGORY_ICONS: Record<ReceiptCategory, string> = {
  food: '🍜',
  transport: '🚆',
  lodging: '🏨',
  shopping: '🛍️',
  entertainment: '🎬',
  groceries: '🛒',
  health: '💊',
  business: '💼',
  other: '📄',
};

export const ALL_CATEGORIES: ReceiptCategory[] = [
  'food',
  'transport',
  'lodging',
  'shopping',
  'entertainment',
  'groceries',
  'health',
  'business',
  'other',
];

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------
//
// A group bundles receipts (e.g. a trip "Japan 2026", a project, a month).
// Stored via useUserList key "receipt_groups", itemId = group.id.

export type ReceiptGroup = {
  id: string;
  name: string;
  description: string;
  // Optional default currency for receipts added to this group (e.g. JPY for a
  // Japan trip) so the user doesn't re-pick it every time.
  defaultCurrency: CurrencyCode;
  color: string; // accent color hex for the group card
  emoji: string;
  createdAt: number;
};

// ---------------------------------------------------------------------------
// Receipts
// ---------------------------------------------------------------------------
//
// Stored via useUserList key "receipt_items", itemId = receipt.id.
// filterKey is "groupId" so receipts can be queried per group.

export type ReceiptImage = {
  // For the real app this is an uploaded URL (UploadThing). The mock uses a
  // base64 data URL or a placeholder.
  url: string;
  width?: number;
  height?: number;
};

export type Receipt = {
  id: string;
  groupId: string;
  merchant: string;
  purpose: string; // why this was bought / what it was for
  category: ReceiptCategory;
  // Amount in the receipt's original currency.
  amount: number;
  currency: CurrencyCode;
  // Cached conversion to home currency at time of entry (recomputed live too).
  homeAmount?: number;
  image?: ReceiptImage;
  notes: string;
  // ISO date string of the purchase (not the entry time).
  purchaseDate: string;
  createdAt: number;
  updatedAt: number;
};

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export type GroupSummary = {
  groupId: string;
  receiptCount: number;
  totalHome: number; // total converted to home currency
  byCategory: Record<string, number>;
  byCurrency: Record<string, number>;
};

export type SpendInsights = {
  totalHome: number;
  receiptCount: number;
  byCategory: Record<string, number>;
  byCurrency: Record<string, number>;
  byGroup: Record<string, number>;
};

// ---------------------------------------------------------------------------
// Screen navigation
// ---------------------------------------------------------------------------

export type ReceiptScreen =
  | 'groups'
  | 'group_detail'
  | 'add_receipt'
  | 'receipt_detail'
  | 'insights'
  | 'settings';
