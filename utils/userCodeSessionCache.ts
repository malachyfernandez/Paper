import * as SecureStore from 'expo-secure-store';

const USER_CODE_SESSION_TOKEN_KEY = 'paper.userCodeSessionToken';

export const userCodeSessionCache = {
  async getSessionToken() {
    try {
      return await SecureStore.getItemAsync(USER_CODE_SESSION_TOKEN_KEY);
    } catch (error) {
      return null;
    }
  },
  async saveSessionToken(sessionToken: string) {
    try {
      await SecureStore.setItemAsync(USER_CODE_SESSION_TOKEN_KEY, sessionToken);
    } catch (error) {
      return;
    }
  },
  async clearSessionToken() {
    try {
      await SecureStore.deleteItemAsync(USER_CODE_SESSION_TOKEN_KEY);
    } catch (error) {
      return;
    }
  },
};
