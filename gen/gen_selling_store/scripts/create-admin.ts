import crypto from 'crypto';
import readline from 'readline';
import { getDb } from '../src/lib/db/index';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('=== Створення облікового запису адміністратора Gen ===\n');

  let username = process.argv[2];
  let password = process.argv[3];
  let name = process.argv[4];

  if (!username) {
    username = await prompt('Введіть логін адміністратора: ');
  }
  if (!username) {
    console.error('Помилка: логін не може бути порожнім.');
    process.exit(1);
  }

  if (!password) {
    password = await prompt('Введіть надійний пароль: ');
  }
  if (!password || password.length < 8) {
    console.error('Помилка: пароль повинен містити щонайменше 8 символів.');
    process.exit(1);
  }

  if (!name) {
    name = (await prompt('Введіть ім’я адміністратора (за замовчуванням "Головний адміністратор"): ')) || 'Головний адміністратор';
  }

  const db = getDb();
  const existing = await db.get('SELECT id FROM admins WHERE username = $1', [username.trim()]);

  const passwordHash = hashPassword(password);
  const adminId = `admin_${crypto.randomBytes(8).toString('hex')}`;
  const now = new Date().toISOString();

  if (existing) {
    await db.run(
      'UPDATE admins SET password_hash = $1, name = $2 WHERE username = $3',
      [passwordHash, name, username.trim()]
    );
    console.log(`\nПароль для адміністратора "${username}" успішно оновлено.`);
  } else {
    await db.run(
      'INSERT INTO admins (id, username, password_hash, name, created_at) VALUES ($1, $2, $3, $4, $5)',
      [adminId, username.trim(), passwordHash, name, now]
    );
    console.log(`\nАдміністратора "${username}" успішно створено.`);
  }

  console.log('Тепер ви можете увійти на сторінці: /admin/login');
  process.exit(0);
}

main().catch((err) => {
  console.error('Помилка:', err);
  process.exit(1);
});
