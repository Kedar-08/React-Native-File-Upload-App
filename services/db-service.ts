import { getDatabase } from "@/storage";
import * as bcrypt from "bcryptjs";

export interface User {
  id: number;
  email: string;
  password: string;
  createdAt: string;
}

// Create a new user
export async function createUser(
  email: string,
  password: string,
): Promise<User> {
  const db = await getDatabase();

  // Check if user already exists
  const existingUser = await db.getFirstAsync<User>(
    "SELECT * FROM users WHERE email = ?",
    [email],
  );

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash password before storing
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert new user
  const result = await db.runAsync(
    "INSERT INTO users (email, password) VALUES (?, ?)",
    [email, hashedPassword],
  );

  const newUser = await db.getFirstAsync<User>(
    "SELECT * FROM users WHERE id = ?",
    [result.lastInsertRowId],
  );

  if (!newUser) {
    throw new Error("Failed to create user");
  }

  return newUser;
}

// Find user by email
export async function findUserByEmail(email: string): Promise<User | null> {
  const db = await getDatabase();

  const user = await db.getFirstAsync<User>(
    "SELECT * FROM users WHERE email = ?",
    [email],
  );

  return user || null;
}

// Find user by id
export async function findUserById(id: number): Promise<User | null> {
  const db = await getDatabase();

  const user = await db.getFirstAsync<User>(
    "SELECT * FROM users WHERE id = ?",
    [id],
  );

  return user || null;
}

// Verify password using bcrypt (with fallback for legacy plain-text passwords)
export async function verifyPassword(
  inputPassword: string,
  storedPassword: string,
): Promise<boolean> {
  // Check if stored password is hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
  if (storedPassword.startsWith("$2")) {
    return await bcrypt.compare(inputPassword, storedPassword);
  }

  // Fallback for legacy plain-text passwords (for existing users)
  // In production, you'd want to migrate these by rehashing on successful login
  return inputPassword === storedPassword;
}

// Update user password (used for migrating legacy plain-text passwords)
export async function updateUserPassword(
  userId: number,
  newPassword: string,
): Promise<void> {
  const db = await getDatabase();
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db.runAsync("UPDATE users SET password = ? WHERE id = ?", [
    hashedPassword,
    userId,
  ]);
}
