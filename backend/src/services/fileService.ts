import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { 
  IFileService, 
  IUploadedFile, 
  IFileValidationResult, 
  IFileUploadResult 
} from '../interfaces/IFileService';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const access = promisify(fs.access);

export class FileService implements IFileService {
  private uploadDir: string;
  private maxFileSize: number;
  private allowedMimeTypes: string[];

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads', 'cvs');
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedMimeTypes = ['application/pdf'];
  }

  async uploadCV(file: IUploadedFile, candidateId: number): Promise<IFileUploadResult> {
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error || 'File validation failed');
    }

    // Ensure upload directory exists
    await this.ensureUploadDirectory();

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = path.extname(file.originalname);
    const fileName = `candidate_${candidateId}_cv_${timestamp}${fileExtension}`;
    const filePath = path.join(this.uploadDir, fileName);

    // Save file
    await writeFile(filePath, file.buffer);

    return {
      fileName,
      filePath,
      originalName: file.originalname,
      size: file.size
    };
  }

  validateFile(file: IUploadedFile): IFileValidationResult {
    // Check if file exists
    if (!file) {
      return { isValid: false, error: 'No file provided' };
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      return { 
        isValid: false, 
        error: `File size exceeds maximum limit of ${this.maxFileSize / (1024 * 1024)}MB` 
      };
    }

    // Check file type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      return { 
        isValid: false, 
        error: `File type not allowed. Only ${this.allowedMimeTypes.join(', ')} are permitted` 
      };
    }

    // Check file has content
    if (file.size === 0) {
      return { isValid: false, error: 'File is empty' };
    }

    // Additional PDF validation
    if (file.mimetype === 'application/pdf') {
      // Basic PDF header check
      const pdfHeader = file.buffer.slice(0, 4);
      if (pdfHeader.toString() !== '%PDF') {
        return { isValid: false, error: 'Invalid PDF file' };
      }
    }

    return { isValid: true };
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      // Check if file exists
      await access(filePath);
      // Delete file
      await unlink(filePath);
    } catch (error) {
      // File doesn't exist or can't be deleted
      console.warn(`Could not delete file ${filePath}:`, error);
    }
  }

  getFileUrl(fileName: string): string {
    return `/api/files/cv/${fileName}`;
  }

  async ensureUploadDirectory(): Promise<void> {
    try {
      await access(this.uploadDir);
    } catch (error) {
      // Directory doesn't exist, create it
      await mkdir(this.uploadDir, { recursive: true });
    }
  }
}
