import { v } from 'convex/values';
import { query } from './_generated/server';
import { resolveAppUser } from './userCodeAuth';

/**
 * ReceiptVault Convex helpers.
 *
 * Receipts and groups live in userVariables (useUserList key "receipt_items"
 * and "receipt_groups"). These queries aggregate a single user's receipts
 * server-side so the client doesn't have to pull every row to compute totals.
 *
 * Conversion is intentionally left to the client, where the user's editable
 * exchange-rate table lives; these helpers return raw per-currency subtotals.
 */

// ---------------------------------------------------------------------------
// Per-group raw subtotals (grouped by original currency + category)
// ---------------------------------------------------------------------------

export const getGroupBreakdown = query({
  args: {
    groupId: v.string(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const appUser = await resolveAppUser(ctx, args.sessionToken);
    if (!appUser) return null;

    const rows = await ctx.db
      .query('user_lists')
      .withIndex('by_user_key_sort', (q: any) =>
        q.eq('userToken', appUser.userToken).eq('key', 'receipt_items')
      )
      .collect();

    const byCurrency: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    let count = 0;

    for (const row of rows) {
      const value = row.value as any;
      if (!value || value.groupId !== args.groupId) continue;
      count += 1;
      const amount = Number(value.amount) || 0;
      const currency = String(value.currency || 'USD');
      const category = String(value.category || 'other');
      byCurrency[currency] = (byCurrency[currency] ?? 0) + amount;
      byCategory[category] = (byCategory[category] ?? 0) + amount;
    }

    return { groupId: args.groupId, count, byCurrency, byCategory };
  },
});

// ---------------------------------------------------------------------------
// Whole-account raw subtotals (grouped by group, currency, category)
// ---------------------------------------------------------------------------

export const getAccountBreakdown = query({
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const appUser = await resolveAppUser(ctx, args.sessionToken);
    if (!appUser) return null;

    const rows = await ctx.db
      .query('user_lists')
      .withIndex('by_user_key_sort', (q: any) =>
        q.eq('userToken', appUser.userToken).eq('key', 'receipt_items')
      )
      .collect();

    const byCurrency: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byGroup: Record<string, number> = {};

    for (const row of rows) {
      const value = row.value as any;
      if (!value) continue;
      const amount = Number(value.amount) || 0;
      const currency = String(value.currency || 'USD');
      const category = String(value.category || 'other');
      const groupId = String(value.groupId || 'ungrouped');
      byCurrency[currency] = (byCurrency[currency] ?? 0) + amount;
      byCategory[category] = (byCategory[category] ?? 0) + amount;
      byGroup[groupId] = (byGroup[groupId] ?? 0) + amount;
    }

    return {
      receiptCount: rows.length,
      byCurrency,
      byCategory,
      byGroup,
    };
  },
});
