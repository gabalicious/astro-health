import type { ProfilePayload } from '@/lib/schema/profile';

/**
 * In-memory stand-in for the database. It resets whenever the server restarts —
 * fine while this is a stub, and the shape of these functions is what a real
 * repository layer would expose.
 */

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

const usersById = new Map<string, User>();
const userIdByEmail = new Map<string, string>();
const profilesByUserId = new Map<string, ProfilePayload>();
const sessions = new Map<string, string>();

const normalise = (email: string) => email.trim().toLowerCase();

export function findUserByEmail(email: string): User | undefined {
  const id = userIdByEmail.get(normalise(email));
  return id ? usersById.get(id) : undefined;
}

/** Passwords are deliberately not stored yet — hashing lands with the database. */
export function createUser(email: string): User {
  const user: User = {
    id: crypto.randomUUID(),
    email: normalise(email),
    createdAt: new Date().toISOString(),
  };

  usersById.set(user.id, user);
  userIdByEmail.set(user.email, user.id);
  return user;
}

export function createSession(userId: string): string {
  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, userId);
  return sessionId;
}

export function userIdForSession(sessionId: string | undefined): string | undefined {
  return sessionId ? sessions.get(sessionId) : undefined;
}

export function saveProfile(userId: string, profile: ProfilePayload) {
  profilesByUserId.set(userId, profile);
}

export function getProfile(userId: string): ProfilePayload | undefined {
  return profilesByUserId.get(userId);
}
