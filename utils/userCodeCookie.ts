import { Platform } from "react-native";

const COOKIE_NAME = "paper_user_code";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function isWeb(): boolean {
  return Platform.OS === "web";
}

export function getUserCodeFromCookie(): string | null {
  if (!isWeb()) return null;

  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

export function setUserCodeCookie(code: string): void {
  if (!isWeb()) return;

  try {
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(code)};max-age=${COOKIE_MAX_AGE};path=/;SameSite=Lax`;
  } catch {
    // Silently fail on cookie errors
  }
}

export function clearUserCodeCookie(): void {
  if (!isWeb()) return;

  try {
    document.cookie = `${COOKIE_NAME}=;max-age=0;path=/;SameSite=Lax`;
  } catch {
    // Silently fail on cookie errors
  }
}
