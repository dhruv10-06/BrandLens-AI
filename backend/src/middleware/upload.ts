import multer from 'multer';
import path from 'path';
import { ENV } from '../config/env.js';

// Use memoryStorage to avoid disk path traversal vulnerabilities
const storage = multer.memoryStorage();

const allowedMimeTypes = ['application/pdf', 'text/plain'];
const allowedExtensions = ['.pdf', '.txt'];

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: ENV.MAX_FILE_SIZE_MB * 1024 * 1024, // 10MB limit
    files: 1, // Strictly single file upload
    fields: 5,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isMimeAllowed = allowedMimeTypes.includes(file.mimetype);
    const isExtAllowed = allowedExtensions.includes(ext);

    if (isMimeAllowed && isExtAllowed) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file format: ${ext || file.mimetype}. Only approved .pdf and .txt brand guidelines are accepted.`
        )
      );
    }
  },
});
