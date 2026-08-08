export interface AuthSession {
  id: string;
  email: string | null;
  displayName: string | null;
  profileImageUrl: string | null;
}
