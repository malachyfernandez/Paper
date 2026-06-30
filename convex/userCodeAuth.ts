import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const USER_CODE_ENV_KEY = "PAPER_USER_CODES_JSON";

type UserCodeDefinition = {
  userId: string;
  name: string;
  email: string;
};

function normalizeUserCode(code: string) {
  return code.trim();
}

function isUserCodeDefinition(value: unknown): value is UserCodeDefinition {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.userId === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.email === "string"
  );
}

function parseUserCodeDefinitions() {
  const rawValue = process.env[USER_CODE_ENV_KEY];

  if (!rawValue) {
    return {} as Record<string, UserCodeDefinition>;
  }

  const parsed = JSON.parse(rawValue) as unknown;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${USER_CODE_ENV_KEY} must be a JSON object keyed by user code.`);
  }

  const definitions: Record<string, UserCodeDefinition> = {};

  for (const [code, value] of Object.entries(parsed)) {
    if (!isUserCodeDefinition(value)) {
      throw new Error(`${USER_CODE_ENV_KEY} has an invalid entry for code "${code}".`);
    }

    const normalizedCode = normalizeUserCode(code);

    if (!normalizedCode) {
      continue;
    }

    definitions[normalizedCode] = {
      userId: value.userId,
      name: value.name,
      email: value.email,
    };
  }

  return definitions;
}

async function getSessionByToken(ctx: any, sessionToken?: string | null) {
  const normalizedSessionToken = sessionToken?.trim();

  if (!normalizedSessionToken) {
    return null;
  }

  return await ctx.db
    .query("user_code_sessions")
    .withIndex("by_session_token", (q: any) => q.eq("sessionToken", normalizedSessionToken))
    .unique();
}

export async function resolveAppUser(ctx: any, sessionToken?: string | null) {
  const identity = await ctx.auth.getUserIdentity();

  if (identity?.subject) {
    return {
      source: "clerk" as const,
      userToken: identity.subject,
      name: typeof identity.name === "string" ? identity.name : "",
      email: typeof identity.email === "string" ? identity.email : "",
    };
  }

  const session = await getSessionByToken(ctx, sessionToken);

  if (!session) {
    return null;
  }

  const definition = parseUserCodeDefinitions()[session.code];

  if (!definition) {
    return null;
  }

  return {
    source: "user_code" as const,
    userToken: definition.userId,
    name: definition.name,
    email: definition.email,
    sessionToken: session.sessionToken,
    code: session.code,
  };
}

export const signIn = mutation({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedCode = normalizeUserCode(args.code);
    const definition = parseUserCodeDefinitions()[normalizedCode];

    if (!definition) {
      throw new Error("Invalid user code.");
    }

    const now = Date.now();
    const sessionToken = crypto.randomUUID();

    await ctx.db.insert("user_code_sessions", {
      sessionToken,
      code: normalizedCode,
      userId: definition.userId,
      name: definition.name,
      email: definition.email,
      createdAt: now,
      lastUsedAt: now,
    });

    return {
      sessionToken,
      code: normalizedCode,
      userId: definition.userId,
      name: definition.name,
      email: definition.email,
      createdAt: now,
      lastUsedAt: now,
    };
  },
});

export const getSession = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await getSessionByToken(ctx, args.sessionToken);

    if (!session) {
      return null;
    }

    const definition = parseUserCodeDefinitions()[session.code];

    if (!definition) {
      return null;
    }

    return {
      sessionToken: session.sessionToken,
      code: session.code,
      userId: definition.userId,
      name: definition.name,
      email: definition.email,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
    };
  },
});

export const signOut = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await getSessionByToken(ctx, args.sessionToken);

    if (!session) {
      return { success: true };
    }

    await ctx.db.delete(session._id);

    return { success: true };
  },
});
