// ============================================================================
// ReceiptVault — Client-side AI receipt scanning via OpenRouter
// ============================================================================
//
// The user brings their own OpenRouter API key (stored PRIVATE per user in
// `receipts_settings.openRouterKey`). The request is made directly from the
// client to OpenRouter — the key is never sent to a ReceiptVault/Convex server.
//
// We send the receipt photo (as a base64 data URL) to a vision-capable model
// and ask it to return a strict JSON object that maps onto our form fields.
// ============================================================================

import {
  ReceiptScanResult,
  ReceiptCategory,
  ALL_CATEGORIES,
  DEFAULT_AI_MODEL,
} from '../../../../types/receipts';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const SCAN_PROMPT = [
  'You are a receipt parser. Read this receipt image and return ONLY a compact JSON',
  'object (no markdown, no prose) with these keys:',
  '- merchant (string)',
  '- amount (number, the grand total)',
  '- currency (ISO 4217 code such as USD, JPY, EUR, GBP, KRW, THB)',
  `- category (one of: ${ALL_CATEGORIES.join(', ')})`,
  '- purchaseDate (YYYY-MM-DD)',
  '- purpose (short human description of what this was)',
  '- notes (key line items, comma separated)',
  'If a field is unreadable, omit it. Output JSON only.',
].join(' ');

/**
 * Pull a JSON object out of a model response that may be wrapped in prose or
 * markdown fences.
 */
function extractJson(text: string): Record<string, unknown> | null {
  if (!text) return null;
  let t = text.trim();
  t = t
    .replace(/^```json/i, '')
    .replace(/^```/, '')
    .replace(/```$/, '')
    .trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start >= 0 && end > start) t = t.slice(start, end + 1);
  try {
    return JSON.parse(t) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function coerceResult(raw: Record<string, unknown>): ReceiptScanResult {
  const out: ReceiptScanResult = {};
  if (typeof raw.merchant === 'string') out.merchant = raw.merchant;
  if (typeof raw.amount === 'number') out.amount = raw.amount;
  else if (typeof raw.amount === 'string') {
    const n = parseFloat(raw.amount.replace(/[^0-9.]/g, ''));
    if (!Number.isNaN(n)) out.amount = n;
  }
  if (typeof raw.currency === 'string') out.currency = raw.currency.toUpperCase();
  if (
    typeof raw.category === 'string' &&
    ALL_CATEGORIES.includes(raw.category as ReceiptCategory)
  ) {
    out.category = raw.category as ReceiptCategory;
  }
  if (typeof raw.purchaseDate === 'string') out.purchaseDate = raw.purchaseDate;
  if (typeof raw.purpose === 'string') out.purpose = raw.purpose;
  if (typeof raw.notes === 'string') out.notes = raw.notes;
  return out;
}

export class OpenRouterError extends Error {}

/**
 * Scan a receipt image with OpenRouter. `imageDataUrl` must be a
 * `data:image/...;base64,...` URL. Returns the parsed fields.
 *
 * @throws OpenRouterError on missing key, network error, or unparseable output.
 */
export async function scanReceiptWithAI(
  imageDataUrl: string,
  apiKey: string,
  model: string = DEFAULT_AI_MODEL
): Promise<ReceiptScanResult> {
  if (!apiKey) throw new OpenRouterError('Add an OpenRouter API key in Settings to scan receipts.');
  if (!imageDataUrl) throw new OpenRouterError('No image to scan.');

  let res: Response;
  try {
    res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: SCAN_PROMPT },
              { type: 'image_url', image_url: { url: imageDataUrl } },
            ],
          },
        ],
      }),
    });
  } catch {
    throw new OpenRouterError('Network error contacting OpenRouter.');
  }

  if (!res.ok) {
    const body = await res.text();
    throw new OpenRouterError(`OpenRouter ${res.status}: ${body.slice(0, 160)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content ?? '';
  const parsed = extractJson(content);
  if (!parsed) throw new OpenRouterError('Could not read the receipt. Try a clearer photo.');
  return coerceResult(parsed);
}

/**
 * Convert a (possibly remote / file) image URI to a base64 data URL suitable
 * for the OpenRouter request. Works on web (blob/data URIs) and native.
 */
export async function imageUriToDataUrl(uri: string): Promise<string> {
  if (uri.startsWith('data:')) return uri;
  const resp = await fetch(uri);
  const blob = await resp.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
