import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { ProfilePayload } from '@/lib/schema/profile';
import type { WorkoutPayload } from '@/lib/schema/workout';

/**
 * In-memory stand-in for the database. It resets whenever the server restarts —
 * fine while this is a stub, and the shape of these functions is what a real
 * repository layer would expose.
 */

export interface User {
  id: string;
  email: string;
  createdAt: string;
  passwordHash: string;
  salt: string;
}

const usersById = new Map<string, User>();
const userIdByEmail = new Map<string, string>();
const profilesByUserId = new Map<string, ProfilePayload>();
const sessions = new Map<string, string>();
const workoutsByUserId = new Map<string, LoggedWorkout[]>();

const normalise = (email: string) => email.trim().toLowerCase();

export function findUserByEmail(email: string): User | undefined {
  const id = userIdByEmail.get(normalise(email));
  return id ? usersById.get(id) : undefined;
}

export function createUser(email: string, password: string): User {
  const salt = randomBytes(16).toString('hex');
  const user: User = {
    id: crypto.randomUUID(),
    email: normalise(email),
    createdAt: new Date().toISOString(),
    passwordHash: scryptSync(password, salt, 64).toString('hex'),
    salt,
  };

  usersById.set(user.id, user);
  userIdByEmail.set(user.email, user.id);
  return user;
}

/** Stub-grade but not plaintext: per-user salt + scrypt, constant-time compare. */
export function verifyCredentials(email: string, password: string): User | undefined {
  const user = findUserByEmail(email);
  if (!user) return undefined;

  const candidate = scryptSync(password, user.salt, 64);
  const stored = Buffer.from(user.passwordHash, 'hex');
  // timingSafeEqual throws on length mismatch, so guard first.
  return candidate.length === stored.length && timingSafeEqual(candidate, stored)
    ? user
    : undefined;
}

export function createSession(userId: string): string {
  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, userId);
  return sessionId;
}

export function userIdForSession(sessionId: string | undefined): string | undefined {
  return sessionId ? sessions.get(sessionId) : undefined;
}

export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId);
}

export function saveProfile(userId: string, profile: ProfilePayload) {
  profilesByUserId.set(userId, profile);
}

export function getProfile(userId: string): ProfilePayload | undefined {
  return profilesByUserId.get(userId);
}

export type LoggedWorkout = WorkoutPayload & {
  id: string;
  loggedAt: string;
};

export function addWorkout(userId: string, workout: WorkoutPayload): LoggedWorkout {
  const logged: LoggedWorkout = {
    ...workout,
    id: crypto.randomUUID(),
    loggedAt: new Date().toISOString(),
  };

  workoutsByUserId.set(userId, [logged, ...(workoutsByUserId.get(userId) ?? [])]);
  return logged;
}

/** Newest first — a training log is read from the top. */
export function listWorkouts(userId: string): LoggedWorkout[] {
  return workoutsByUserId.get(userId) ?? [];
}
