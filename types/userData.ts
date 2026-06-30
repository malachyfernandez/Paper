/**
 * Core user profile shape synced from the auth provider into a userVariable.
 * Every app built on this baseline can extend this with its own fields.
 */
export interface UserData {
  name: string;
  email: string;
  userId: string;
}
