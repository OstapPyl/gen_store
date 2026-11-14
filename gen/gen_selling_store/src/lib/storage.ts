import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const UPLOAD_DIR = process.env.STORAGE_DIR 
  ? path.resolve(process.cwd(), process.env.STORAGE_DIR)
  : path.resolve(process.cwd(), 'public', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_DOC_MIMES = new Set(['application/pdf']);

const DISALLOWED_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.ps1', '.php', '.phtml', '.js', '.ts', '.py',
  '.dll', '.com', '.vbs', '.scr', '.msi', '.jar', '.cgi', '.pl'
]);

export interface SavedFileResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export async function saveUploadedFile(file: File, category: 'images' | 'manuals'): Promise<SavedFileResult> {
  const originalName = file.name || 'unnamed';
  const ext = path.extname(originalName).toLowerCase();

  if (DISALLOWED_EXTENSIONS.has(ext)) {
    throw new Error('Завантаження виконуваних або небезпечних файлів суворо заборонено.');
  }

  const mime = file.type;
  if (category === 'images') {
    if (!ALLOWED_IMAGE_MIMES.has(mime) || !['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      throw new Error('Дозволені формати зображень: JPEG, PNG, WebP.');
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Розмір зображення не може перевищувати 10 МБ.');
    }
  } else if (category === 'manuals') {
    if (!ALLOWED_DOC_MIMES.has(mime) || ext !== '.pdf') {
      throw new Error('Дозволений формат інструкцій: лише PDF.');
    }
    if (file.size > 20 * 1024 * 1024) {
      throw new Error('Розмір інструкції не може перевищувати 20 МБ.');
    }
  }

  // Create unique safe filename
  const randomHex = crypto.randomBytes(12).toString('hex');
  const safeFilename = `${category}_${Date.now()}_${randomHex}${ext}`;
  const targetPath = path.join(UPLOAD_DIR, safeFilename);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Validate magic bytes for added security
  if (category === 'images') {
    if (ext === '.png' && (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4e || buffer[3] !== 0x47)) {
      throw new Error('Недійсний формат файлу PNG.');
    }
    if ((ext === '.jpg' || ext === '.jpeg') && (buffer[0] !== 0xff || buffer[1] !== 0xd8)) {
      throw new Error('Недійсний формат файлу JPEG.');
    }
  } else if (category === 'manuals') {
    if (buffer.subarray(0, 4).toString('ascii') !== '%PDF') {
      throw new Error('Файл не є дійсним PDF документом.');
    }
  }

  fs.writeFileSync(targetPath, buffer);

  // URL path accessible via Next.js public directory
  const url = `/uploads/${safeFilename}`;

  return {
    url,
    filename: safeFilename,
    size: file.size,
    mimeType: mime,
  };
}

export function deleteUploadedFile(url: string): boolean {
  try {
    const filename = path.basename(url);
    const targetPath = path.join(UPLOAD_DIR, filename);
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
