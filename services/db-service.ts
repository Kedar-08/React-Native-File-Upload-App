import { getDatabase } from "@/storage";

export interface User {
  id: number;
  email: string;
  password: string;
  phoneNumber: string;
  createdAt: string;
}

// Create a new user
export async function createUser(
  email: string,
  password: string,
  phoneNumber: string,
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

  // Insert new user
  const result = await db.runAsync(
    "INSERT INTO users (email, password, phoneNumber) VALUES (?, ?, ?)",
    [email, password, phoneNumber],
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

// Verify password (simple comparison)
export function verifyPassword(
  inputPassword: string,
  storedPassword: string,
): boolean {
  return inputPassword === storedPassword;
}
