import multer from 'multer';
import { Request } from 'express';

// Configure multer for memory storage (we'll handle file saving in FileService)
const storage = multer.memoryStorage();

// File filter for CV uploads
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only PDF files
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
};

// Multer configuration
export const uploadConfig = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file at a time
  }
});

// Export specific upload configurations
export const uploadCV = uploadConfig.single('cv');
export const uploadMultiple = uploadConfig.array('files', 5);
