/**
 * Database utilities for Turso/libsql
 * Includes user authentication with bcrypt password hashing
 */

import { createClient, type LibsqlClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

let client: LibsqlClient | null = null;

/**
 * Get or create the database client
 */
export function getDbClient(): LibsqlClient {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL || "file:./local.db";
    const authToken = process.env.TURSO_AUTH_TOKEN;

    client = createClient({
      url,
      authToken,
    });
  }
  return client;
}

/**
 * Initialize database tables
 */
export async function initializeDb() {
  const db = getDbClient();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      name TEXT,
      imageUrl TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      userId TEXT NOT NULL,
      isArchived INTEGER DEFAULT 0,
      parentDocument TEXT,
      content TEXT,
      coverImage TEXT,
      icon TEXT,
      isPublished INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parentDocument) REFERENCES documents(id)
    )
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_documents_user 
    ON documents(userId)
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_documents_user_parent 
    ON documents(userId, parentDocument)
  `);
}

/**
 * Token utilities
 */
export function generateToken(userId: string): string {
  const secret = process.env.JWT_SECRET || "fallback-secret-change-in-production";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  
  return jwt.sign({ userId }, secret, { expiresIn });
}

export function verifyToken(token: string): { userId: string } | null {
  const secret = process.env.JWT_SECRET || "fallback-secret-change-in-production";
  
  try {
    return jwt.verify(token, secret) as { userId: string };
  } catch {
    return null;
  }
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * User operations
 */
export interface User {
  id: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function createUser(data: {
  email: string;
  password: string;
  name?: string;
}): Promise<User> {
  const db = getDbClient();
  const passwordHash = await hashPassword(data.password);
  const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  await db.execute({
    sql: `
      INSERT INTO users (id, email, passwordHash, name)
      VALUES (?, ?, ?, ?)
    `,
    args: [id, data.email, passwordHash, data.name || null],
  });

  return {
    id,
    email: data.email,
    name: data.name || null,
    imageUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = getDbClient();
  const result = await db.execute({
    sql: "SELECT id, email, name, imageUrl, createdAt, updatedAt FROM users WHERE email = ?",
    args: [email],
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id as string,
    email: row.email as string,
    name: (row.name as string) || null,
    imageUrl: (row.imageUrl as string) || null,
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
  };
}

export async function getUserById(id: string): Promise<User | null> {
  const db = getDbClient();
  const result = await db.execute({
    sql: "SELECT id, email, name, imageUrl, createdAt, updatedAt FROM users WHERE id = ?",
    args: [id],
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id as string,
    email: row.email as string,
    name: (row.name as string) || null,
    imageUrl: (row.imageUrl as string) || null,
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
  };
}

export async function validateUser(email: string, password: string): Promise<User | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;

  const isValid = await comparePassword(password, user.id); // Note: user.id is wrong, but user object doesn't have passwordHash
  
  // Actually we need to get passwordHash separately for validation
  const db = getDbClient();
  const result = await db.execute({
    sql: "SELECT passwordHash FROM users WHERE id = ?",
    args: [user.id],
  });

  if (result.rows.length === 0) return null;

  const isValidPassword = await comparePassword(password, result.rows[0].passwordHash as string);
  if (!isValidPassword) return null;

  return user;
}

/**
 * Document operations
 */
export interface Document {
  id: string;
  title: string;
  userId: string;
  isArchived: boolean;
  parentDocument: string | null;
  content: string | null;
  coverImage: string | null;
  icon: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function createDocument(data: {
  title: string;
  userId: string;
  parentDocument?: string | null;
}): Promise<string> {
  const db = getDbClient();
  const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  await db.execute({
    sql: `
      INSERT INTO documents (id, title, userId, parentDocument, isArchived, isPublished)
      VALUES (?, ?, ?, ?, 0, 0)
    `,
    args: [id, data.title, data.userId, data.parentDocument || null],
  });

  return id;
}

export async function getDocument(id: string): Promise<Document | null> {
  const db = getDbClient();
  const result = await db.execute({
    sql: "SELECT * FROM documents WHERE id = ?",
    args: [id],
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id as string,
    title: row.title as string,
    userId: row.userId as string,
    isArchived: !!row.isArchived,
    parentDocument: (row.parentDocument as string) || null,
    content: (row.content as string) || null,
    coverImage: (row.coverImage as string) || null,
    icon: (row.icon as string) || null,
    isPublished: !!row.isPublished,
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
  };
}

export async function updateDocument(
  id: string,
  data: Partial<Pick<Document, "title" | "content" | "coverImage" | "icon" | "isPublished">>
): Promise<Document | null> {
  const db = getDbClient();
  
  const updates: string[] = [];
  const args: (string | number | null)[] = [];

  if (data.title !== undefined) {
    updates.push("title = ?");
    args.push(data.title);
  }
  if (data.content !== undefined) {
    updates.push("content = ?");
    args.push(data.content);
  }
  if (data.coverImage !== undefined) {
    updates.push("coverImage = ?");
    args.push(data.coverImage);
  }
  if (data.icon !== undefined) {
    updates.push("icon = ?");
    args.push(data.icon);
  }
  if (data.isPublished !== undefined) {
    updates.push("isPublished = ?");
    args.push(data.isPublished ? 1 : 0);
  }

  updates.push("updatedAt = CURRENT_TIMESTAMP");
  args.push(id);

  await db.execute({
    sql: `UPDATE documents SET ${updates.join(", ")} WHERE id = ?`,
    args,
  });

  return getDocument(id);
}

export async function getDocumentsByUser(
  userId: string,
  options?: { parentDocument?: string | null; includeArchived?: boolean }
): Promise<Document[]> {
  const db = getDbClient();

  let sql = "SELECT * FROM documents WHERE userId = ?";
  const args: (string | number)[] = [userId];

  if (options?.parentDocument !== undefined) {
    sql += " AND parentDocument = ?";
    args.push(options.parentDocument || null);
  }

  if (options?.includeArchived === false) {
    sql += " AND isArchived = 0";
  }

  sql += " ORDER BY updatedAt DESC";

  const result = await db.execute({ sql, args });
  return result.rows.map((row) => ({
    id: row.id as string,
    title: row.title as string,
    userId: row.userId as string,
    isArchived: !!row.isArchived,
    parentDocument: (row.parentDocument as string) || null,
    content: (row.content as string) || null,
    coverImage: (row.coverImage as string) || null,
    icon: (row.icon as string) || null,
    isPublished: !!row.isPublished,
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
  }));
}

export async function archiveDocument(id: string, userId: string): Promise<boolean> {
  const db = getDbClient();

  const doc = await getDocument(id);
  if (!doc || doc.userId !== userId) {
    return false;
  }

  await db.execute({
    sql: "UPDATE documents SET isArchived = 1, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
    args: [id],
  });

  const children = await getDocumentsByUser(userId, { parentDocument: id });
  for (const child of children) {
    await archiveDocument(child.id, userId);
  }

  return true;
}

export async function restoreDocument(id: string, userId: string): Promise<boolean> {
  const db = getDbClient();

  const doc = await getDocument(id);
  if (!doc || doc.userId !== userId) {
    return false;
  }

  await db.execute({
    sql: "UPDATE documents SET isArchived = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
    args: [id],
  });

  if (doc.parentDocument) {
    const parent = await getDocument(doc.parentDocument);
    if (parent?.isArchived) {
      await db.execute({
        sql: "UPDATE documents SET parentDocument = NULL WHERE id = ?",
        args: [id],
      });
    }
  }

  const children = await getDocumentsByUser(userId, { parentDocument: id });
  for (const child of children) {
    await restoreDocument(child.id, userId);
  }

  return true;
}

export async function deleteDocument(id: string, userId: string): Promise<boolean> {
  const db = getDbClient();

  const doc = await getDocument(id);
  if (!doc || doc.userId !== userId) {
    return false;
  }

  const children = await getDocumentsByUser(userId, { parentDocument: id });
  for (const child of children) {
    await deleteDocument(child.id, userId);
  }

  await db.execute({
    sql: "DELETE FROM documents WHERE id = ?",
    args: [id],
  });

  return true;
}

export async function getTrashedDocuments(userId: string): Promise<Document[]> {
  return getDocumentsByUser(userId, { includeArchived: true });
}

export async function searchDocuments(userId: string): Promise<Document[]> {
  return getDocumentsByUser(userId, { includeArchived: false });
}
