export interface IUploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  filename?: string;
  path?: string;
}

export interface IFileValidationResult {
  isValid: boolean;
  error?: string;
}

export interface IFileUploadResult {
  fileName: string;
  filePath: string;
  originalName: string;
  size: number;
}

export interface IFileService {
  uploadCV(file: IUploadedFile, candidateId: number): Promise<IFileUploadResult>;
  validateFile(file: IUploadedFile): IFileValidationResult;
  deleteFile(filePath: string): Promise<void>;
  getFileUrl(fileName: string): string;
  ensureUploadDirectory(): Promise<void>;
}

export interface IValidationService {
  validateCandidateData(data: any): Promise<{ isValid: boolean; errors: string[] }>;
  validateEmail(email: string): boolean;
  validatePhone(phone: string): boolean;
  sanitizeInput(input: string): string;
}

export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
}

export interface IPaginatedResponse<T> extends IApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
