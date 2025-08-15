import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import crypto from 'crypto';
import { 
  IFileService, 
  IUploadedFile, 
  IFileValidationResult, 
  IFileUploadResult 
} from '../interfaces/IFileService';
import { FILE_UPLOAD_CONFIG, generateUniqueFilename } from '../config/multer';
import { fileStorageSetup, StorageDirectoryConfig } from '../utils/fileStorageSetup';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const access = promisify(fs.access);

export class FileService implements IFileService {
  private uploadDir: string;
  private tempDir: string;
  private backupDir: string;
  private quarantineDir: string;
  private maxFileSize: number;
  private allowedMimeTypes: string[];
  private allowedExtensions: string[];
  private directories: StorageDirectoryConfig;

  constructor() {
    this.directories = fileStorageSetup.getDirectoryConfig();
    this.uploadDir = this.directories.cvs;
    this.tempDir = this.directories.temp;
    this.backupDir = this.directories.backup;
    this.quarantineDir = this.directories.quarantine;
    this.maxFileSize = FILE_UPLOAD_CONFIG.MAX_FILE_SIZE;
    this.allowedMimeTypes = FILE_UPLOAD_CONFIG.ALLOWED_MIME_TYPES;
    this.allowedExtensions = FILE_UPLOAD_CONFIG.ALLOWED_EXTENSIONS;
  }

  async uploadCV(file: IUploadedFile, candidateId: number): Promise<IFileUploadResult> {
    try {
      // Validate file
      const validation = await this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error || 'File validation failed');
      }

      // Ensure upload directory exists
      await this.ensureUploadDirectory();

      // Generate unique filename with security measures
      const fileName = generateUniqueFilename(file.originalname, candidateId);
      const filePath = path.join(this.uploadDir, fileName);

      // Additional security: Check if file already exists (should be extremely rare)
      try {
        await access(filePath);
        // File exists, generate new name
        const newFileName = generateUniqueFilename(file.originalname, candidateId);
        const newFilePath = path.join(this.uploadDir, newFileName);
        await writeFile(newFilePath, file.buffer);
        
        return {
          fileName: newFileName,
          filePath: newFilePath,
          originalName: file.originalname,
          size: file.size
        };
      } catch {
        // File doesn't exist, proceed with original name
        await writeFile(filePath, file.buffer);
        
        return {
          fileName,
          filePath,
          originalName: file.originalname,
          size: file.size
        };
      }
    } catch (error) {
      console.error('File upload error:', error);
      throw new Error(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateFile(file: IUploadedFile): Promise<IFileValidationResult> {
    try {
      // Check if file exists
      if (!file) {
        return { isValid: false, error: 'No file provided' };
      }

      // Check if file has a buffer
      if (!file.buffer || !Buffer.isBuffer(file.buffer)) {
        return { isValid: false, error: 'File data is corrupted or missing' };
      }

      // Check file size
      if (file.size > this.maxFileSize) {
        return { 
          isValid: false, 
          error: `File size exceeds maximum limit of ${this.maxFileSize / (1024 * 1024)}MB` 
        };
      }

      // Check minimum file size (1KB)
      if (file.size < 1024) {
        return { isValid: false, error: 'File is too small. Minimum size is 1KB' };
      }

      // Check file type
      if (!this.allowedMimeTypes.includes(file.mimetype)) {
        return { 
          isValid: false, 
          error: `File type not allowed. Only ${this.allowedExtensions.join(', ')} files are permitted` 
        };
      }

      // Check file extension
      const fileExtension = path.extname(file.originalname).toLowerCase();
      if (!this.allowedExtensions.includes(fileExtension)) {
        return { 
          isValid: false, 
          error: `File extension not allowed. Only ${this.allowedExtensions.join(', ')} files are permitted` 
        };
      }

      // Check filename
      if (!file.originalname || file.originalname.trim() === '') {
        return { isValid: false, error: 'File must have a valid name' };
      }

      // Check for suspicious filename patterns
      const suspiciousPatterns = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.js'];
      const hasDoubleExtension = suspiciousPatterns.some(pattern => 
        file.originalname.toLowerCase().includes(pattern)
      );
      if (hasDoubleExtension) {
        return { isValid: false, error: 'Potentially dangerous file detected' };
      }

      // File type-specific validation
      const contentValidation = await this.validateFileContent(file);
      if (!contentValidation.isValid) {
        return contentValidation;
      }

      return { isValid: true };
    } catch (error) {
      console.error('File validation error:', error);
      return { 
        isValid: false, 
        error: 'File validation failed due to an internal error' 
      };
    }
  }

  private async validateFileContent(file: IUploadedFile): Promise<IFileValidationResult> {
    try {
      switch (file.mimetype) {
        case 'application/pdf':
          return this.validatePDF(file);
        case 'application/msword':
          return this.validateDOC(file);
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return this.validateDOCX(file);
        default:
          return { isValid: false, error: 'Unsupported file type for content validation' };
      }
    } catch (error) {
      return { isValid: false, error: 'Content validation failed' };
    }
  }

  private validatePDF(file: IUploadedFile): IFileValidationResult {
    try {
      // Check PDF magic number (header)
      const pdfHeader = file.buffer.slice(0, 4);
      if (pdfHeader.toString() !== '%PDF') {
        return { isValid: false, error: 'Invalid PDF file - missing PDF header' };
      }

      // Check PDF version
      const versionCheck = file.buffer.slice(0, 8).toString();
      const validVersions = ['%PDF-1.0', '%PDF-1.1', '%PDF-1.2', '%PDF-1.3', '%PDF-1.4', '%PDF-1.5', '%PDF-1.6', '%PDF-1.7', '%PDF-2.0'];
      if (!validVersions.some(version => versionCheck.startsWith(version))) {
        return { isValid: false, error: 'Unsupported PDF version' };
      }

      // Check for PDF trailer (basic structure validation)
      const trailerPattern = /trailer/i;
      if (!trailerPattern.test(file.buffer.toString('binary'))) {
        return { isValid: false, error: 'Invalid PDF structure - missing trailer' };
      }

      // Check file size vs content (basic corruption check)
      if (file.buffer.length !== file.size) {
        return { isValid: false, error: 'File appears to be corrupted' };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'PDF validation failed' };
    }
  }

  private validateDOC(file: IUploadedFile): IFileValidationResult {
    try {
      // Check MS Word DOC magic number
      const docHeader = file.buffer.slice(0, 8);
      const expectedHeader = Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]);
      
      for (let i = 0; i < expectedHeader.length; i++) {
        if (docHeader[i] !== expectedHeader[i]) {
          return { isValid: false, error: 'Invalid DOC file format' };
        }
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'DOC validation failed' };
    }
  }

  private validateDOCX(file: IUploadedFile): IFileValidationResult {
    try {
      // Check DOCX magic number (ZIP signature, since DOCX is a ZIP file)
      const zipHeader = file.buffer.slice(0, 4);
      const expectedHeaders = [
        Buffer.from([0x50, 0x4B, 0x03, 0x04]), // Standard ZIP
        Buffer.from([0x50, 0x4B, 0x05, 0x06]), // Empty ZIP
        Buffer.from([0x50, 0x4B, 0x07, 0x08])  // Spanned ZIP
      ];

      const isValidZip = expectedHeaders.some(header => {
        for (let i = 0; i < header.length; i++) {
          if (zipHeader[i] !== header[i]) return false;
        }
        return true;
      });

      if (!isValidZip) {
        return { isValid: false, error: 'Invalid DOCX file format' };
      }

      // Additional check: look for DOCX-specific content
      const content = file.buffer.toString('binary');
      if (!content.includes('word/') && !content.includes('[Content_Types].xml')) {
        return { isValid: false, error: 'File does not appear to be a valid DOCX document' };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'DOCX validation failed' };
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      // Security check: ensure file is within upload directory
      const resolvedPath = path.resolve(filePath);
      const resolvedUploadDir = path.resolve(this.uploadDir);
      
      if (!resolvedPath.startsWith(resolvedUploadDir)) {
        throw new Error('File deletion not allowed outside upload directory');
      }

      // Check if file exists
      await access(filePath);
      // Delete file
      await unlink(filePath);
      console.log(`File deleted successfully: ${filePath}`);
    } catch (error) {
      // File doesn't exist or can't be deleted
      console.warn(`Could not delete file ${filePath}:`, error);
      throw error; // Re-throw for proper error handling
    }
  }

  async deleteCandidateCV(candidateId: number): Promise<void> {
    try {
      // Find all files belonging to the candidate
      const files = await fs.promises.readdir(this.uploadDir);
      const candidateFiles = files.filter(file => 
        file.startsWith(`candidate_${candidateId}_`)
      );

      // Delete all candidate files
      for (const file of candidateFiles) {
        const filePath = path.join(this.uploadDir, file);
        await this.deleteFile(filePath);
      }
    } catch (error) {
      console.warn(`Could not delete CV files for candidate ${candidateId}:`, error);
    }
  }

  getFileUrl(fileName: string): string {
    return `/api/files/cv/${fileName}`;
  }

  async getFileInfo(fileName: string): Promise<{ exists: boolean; size?: number; path?: string }> {
    try {
      const filePath = path.join(this.uploadDir, fileName);
      const stats = await fs.promises.stat(filePath);
      
      return {
        exists: true,
        size: stats.size,
        path: filePath
      };
    } catch (error) {
      return { exists: false };
    }
  }

  async getFileBuffer(fileName: string): Promise<Buffer> {
    try {
      const filePath = path.join(this.uploadDir, fileName);
      
      // Security check: ensure file is within upload directory
      const resolvedPath = path.resolve(filePath);
      const resolvedUploadDir = path.resolve(this.uploadDir);
      
      if (!resolvedPath.startsWith(resolvedUploadDir)) {
        throw new Error('File access not allowed outside upload directory');
      }

      return await fs.promises.readFile(filePath);
    } catch (error) {
      throw new Error(`Could not read file: ${fileName}`);
    }
  }

  generateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  async ensureUploadDirectory(): Promise<void> {
    try {
      await access(this.uploadDir);
    } catch (error) {
      // Directory doesn't exist, create it
      await mkdir(this.uploadDir, { recursive: true });
      console.log(`Created upload directory: ${this.uploadDir}`);
    }
  }

  getUploadStats(): { uploadDir: string; maxFileSize: number; allowedTypes: string[] } {
    return {
      uploadDir: this.uploadDir,
      maxFileSize: this.maxFileSize,
      allowedTypes: this.allowedMimeTypes
    };
  }

  async moveToQuarantine(fileName: string, reason: string): Promise<void> {
    try {
      const sourcePath = path.join(this.uploadDir, fileName);
      const quarantinePath = path.join(this.quarantineDir, `${Date.now()}_${fileName}`);
      
      // Copy file to quarantine
      const fileBuffer = await fs.promises.readFile(sourcePath);
      await writeFile(quarantinePath, fileBuffer);
      
      // Create quarantine log
      const logEntry = {
        originalFile: fileName,
        quarantineFile: path.basename(quarantinePath),
        reason,
        timestamp: new Date().toISOString()
      };
      
      const logPath = path.join(this.directories.logs, 'quarantine.log');
      await fs.promises.appendFile(logPath, JSON.stringify(logEntry) + '\n');
      
      // Delete original file
      await this.deleteFile(sourcePath);
      
      console.log(`File moved to quarantine: ${fileName} - Reason: ${reason}`);
    } catch (error) {
      console.error(`Failed to quarantine file ${fileName}:`, error);
      throw error;
    }
  }

  async createBackup(fileName: string): Promise<string> {
    try {
      const sourcePath = path.join(this.uploadDir, fileName);
      const backupFileName = `backup_${Date.now()}_${fileName}`;
      const backupPath = path.join(this.backupDir, backupFileName);
      
      const fileBuffer = await fs.promises.readFile(sourcePath);
      await writeFile(backupPath, fileBuffer);
      
      // Log backup creation
      const logEntry = {
        originalFile: fileName,
        backupFile: backupFileName,
        timestamp: new Date().toISOString()
      };
      
      const logPath = path.join(this.directories.logs, 'backup.log');
      await fs.promises.appendFile(logPath, JSON.stringify(logEntry) + '\n');
      
      console.log(`Backup created: ${backupFileName}`);
      return backupFileName;
    } catch (error) {
      console.error(`Failed to create backup for ${fileName}:`, error);
      throw error;
    }
  }

  async processFileSecurely(file: IUploadedFile, candidateId: number): Promise<IFileUploadResult> {
    let tempFileName: string | null = null;
    
    try {
      // First, save to temp directory for processing
      tempFileName = `temp_${Date.now()}_${file.originalname}`;
      const tempPath = path.join(this.tempDir, tempFileName);
      await writeFile(tempPath, file.buffer);
      
      // Enhanced validation using temp file
      const tempFile: IUploadedFile = {
        ...file,
        path: tempPath
      };
      
      const validation = await this.validateFile(tempFile);
      if (!validation.isValid) {
        // Move suspicious file to quarantine
        await this.moveFileToQuarantine(tempPath, validation.error || 'Validation failed');
        throw new Error(validation.error || 'File validation failed');
      }
      
      // File is valid, proceed with normal upload
      const result = await this.uploadCV(file, candidateId);
      
      // Create backup of important files
      await this.createBackup(result.fileName);
      
      // Clean up temp file
      await this.deleteFile(tempPath);
      
      // Log successful upload
      await this.logFileOperation('upload', result.fileName, candidateId);
      
      return result;
    } catch (error) {
      // Clean up temp file if it exists
      if (tempFileName) {
        try {
          await this.deleteFile(path.join(this.tempDir, tempFileName));
        } catch {
          // Ignore cleanup errors
        }
      }
      throw error;
    }
  }

  private async moveFileToQuarantine(filePath: string, reason: string): Promise<void> {
    try {
      const fileName = path.basename(filePath);
      const quarantinePath = path.join(this.quarantineDir, `quarantine_${Date.now()}_${fileName}`);
      
      const fileBuffer = await fs.promises.readFile(filePath);
      await writeFile(quarantinePath, fileBuffer);
      
      // Log quarantine action
      const logEntry = {
        originalPath: filePath,
        quarantinePath,
        reason,
        timestamp: new Date().toISOString()
      };
      
      const logPath = path.join(this.directories.logs, 'quarantine.log');
      await fs.promises.appendFile(logPath, JSON.stringify(logEntry) + '\n');
      
      // Delete original
      await this.deleteFile(filePath);
    } catch (error) {
      console.error('Failed to move file to quarantine:', error);
    }
  }

  private async logFileOperation(operation: string, fileName: string, candidateId?: number): Promise<void> {
    try {
      const logEntry = {
        operation,
        fileName,
        candidateId,
        timestamp: new Date().toISOString(),
        userAgent: 'FileService' // In real implementation, this would come from request
      };
      
      const logPath = path.join(this.directories.logs, 'file_operations.log');
      await fs.promises.appendFile(logPath, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('Failed to log file operation:', error);
    }
  }

  async initializeSecureStorage(): Promise<void> {
    try {
      await fileStorageSetup.setupDirectoryStructure();
      console.log('Secure storage initialized successfully');
    } catch (error) {
      console.error('Failed to initialize secure storage:', error);
      throw error;
    }
  }

  async validateStorageSecurity(): Promise<{ isSecure: boolean; issues: string[] }> {
    return await fileStorageSetup.validateSecurity();
  }

  async getStorageStatistics(): Promise<any> {
    return await fileStorageSetup.getStorageStats();
  }

  async cleanupTempFiles(maxAgeHours: number = 24): Promise<void> {
    return await fileStorageSetup.cleanupTempFiles(maxAgeHours);
  }
}
