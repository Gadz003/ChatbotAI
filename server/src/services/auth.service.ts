import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db/client.js';
import { Errors } from '../errors.js';

const PASSWORD_MIN_LENGTH = 8;

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: string;
}

function toPublicUser(row: UserRow): PublicUser {
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}

function validateEmail(email: unknown): asserts email is string {
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw Errors.validation('E-mail inválido.');
  }
}

function validatePassword(password: unknown): asserts password is string {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
    throw Errors.validation(`A senha deve ter ao menos ${PASSWORD_MIN_LENGTH} caracteres.`);
  }
}

export async function registerUser(name: unknown, email: unknown, password: unknown): Promise<PublicUser> {
  if (typeof name !== 'string' || name.trim().length < 2) {
    throw Errors.validation('Nome inválido.');
  }
  validateEmail(email);
  validatePassword(password);

  const normalizedEmail = email.trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    throw Errors.conflict('Já existe uma conta com este e-mail.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = randomUUID();
  db.prepare(
    'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)'
  ).run(id, name.trim(), normalizedEmail, passwordHash, 'user');

  return { id, name: name.trim(), email: normalizedEmail, role: 'user' };
}

export async function authenticateUser(email: unknown, password: unknown): Promise<PublicUser> {
  const genericError = () => Errors.unauthenticated('Credenciais inválidas.');
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw genericError();
  }

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase()) as
    | UserRow
    | undefined;

  if (!row) {
    // Mantém o custo do bcrypt mesmo quando o e-mail não existe, para não
    // revelar por tempo de resposta se a conta existe (ver UC02 do SRS).
    await bcrypt.hash(password, 10);
    throw genericError();
  }

  const valid = await bcrypt.compare(password, row.password_hash);
  if (!valid) {
    throw genericError();
  }
  return toPublicUser(row);
}

export function getUserById(id: string): PublicUser | null {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
  return row ? toPublicUser(row) : null;
}
