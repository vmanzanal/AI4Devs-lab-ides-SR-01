import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const access = promisify(fs.access);

export interface StorageDirectoryConfig {
  cvs: string;
  temp: string;
  backup: string;
  logs: string;
  quarantine: string;
}

export class FileStorageSetup {
  private baseUploadDir: string;
  private directories: StorageDirectoryConfig;

  constructor(baseDir?: string) {
    this.baseUploadDir = baseDir || path.join(process.cwd(), 'uploads');
    this.directories = {
      cvs: path.join(this.baseUploadDir, 'cvs'),
      temp: path.join(this.baseUploadDir, 'temp'),
      backup: path.join(this.baseUploadDir, 'backup'),
      logs: path.join(this.baseUploadDir, 'logs'),
      quarantine: path.join(this.baseUploadDir, 'quarantine')
    };
  }

  /**
   * Create the complete secure directory structure
   */
  async setupDirectoryStructure(): Promise<void> {
    try {
      console.log('Setting up secure file storage directory structure...');

      // Create main upload directory
      await this.ensureDirectory(this.baseUploadDir);

      // Create subdirectories
      for (const [name, dirPath] of Object.entries(this.directories)) {
        await this.ensureDirectory(dirPath);
        console.log(`✓ Created directory: ${name} (${dirPath})`);
      }

      // Create security files
      await this.createSecurityFiles();

      // Create directory structure documentation
      await this.createDirectoryDocumentation();

      console.log('✅ File storage directory structure setup completed successfully!');
    } catch (error) {
      console.error('❌ Failed to setup directory structure:', error);
      throw error;
    }
  }

  /**
   * Ensure a directory exists, create if it doesn't
   */
  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await access(dirPath);
    } catch (error) {
      await mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Create security files (.htaccess, index.html) to prevent direct access
   */
  private async createSecurityFiles(): Promise<void> {
    // Create .htaccess file to deny direct access (for Apache servers)
    const htaccessContent = `# Deny direct access to uploaded files
Deny from all

# Only allow specific file types to be served
<FilesMatch "\\.(pdf|doc|docx)$">
  Order Allow,Deny
  Deny from all
</FilesMatch>

# Prevent execution of scripts
Options -ExecCGI
AddHandler cgi-script .php .pl .py .jsp .asp .sh .cgi
Options -Indexes
`;

    // Create index.html file to prevent directory listing
    const indexContent = `<!DOCTYPE html>
<html>
<head>
    <title>403 Forbidden</title>
</head>
<body>
    <h1>Access Denied</h1>
    <p>You don't have permission to access this directory.</p>
</body>
</html>`;

    // Create web.config for IIS servers
    const webConfigContent = `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <directoryBrowse enabled="false" />
        <defaultDocument enabled="false" />
        <staticContent>
            <remove fileExtension="*" />
        </staticContent>
        <handlers>
            <clear />
        </handlers>
    </system.webServer>
</configuration>`;

    // Apply security files to each directory
    for (const dirPath of Object.values(this.directories)) {
      await writeFile(path.join(dirPath, '.htaccess'), htaccessContent);
      await writeFile(path.join(dirPath, 'index.html'), indexContent);
      await writeFile(path.join(dirPath, 'web.config'), webConfigContent);
    }

    // Create a robots.txt file in the uploads root
    const robotsContent = `User-agent: *
Disallow: /uploads/
Disallow: /api/files/
`;
    await writeFile(path.join(this.baseUploadDir, 'robots.txt'), robotsContent);

    console.log('✓ Security files created');
  }

  /**
   * Create documentation file explaining the directory structure
   */
  private async createDirectoryDocumentation(): Promise<void> {
    const documentation = `# File Storage Directory Structure

This directory contains the secure file storage system for the Candidate Management System.

## Directory Structure:

### /cvs/
- **Purpose**: Store candidate CV files (PDF, DOC, DOCX)
- **Security**: Direct access denied, files served only through API
- **Naming**: candidate_{id}_{filename}_{timestamp}_{random}.{ext}
- **Retention**: Files are kept until candidate is deleted

### /temp/
- **Purpose**: Temporary storage during file processing
- **Security**: Automatic cleanup after 24 hours
- **Usage**: File validation, virus scanning, format conversion

### /backup/
- **Purpose**: Backup copies of important files
- **Security**: Additional access restrictions
- **Schedule**: Daily backup of active CV files

### /logs/
- **Purpose**: File operation logs and audit trail
- **Content**: Upload/download logs, security events, errors
- **Retention**: Logs kept for 90 days

### /quarantine/
- **Purpose**: Store suspicious or rejected files
- **Security**: Maximum security restrictions
- **Usage**: Files that fail security checks, malware detection

## Security Measures:

1. **Access Control**: All directories have .htaccess, index.html, and web.config files
2. **File Serving**: Files are served only through authenticated API endpoints
3. **Path Validation**: All file operations validate paths to prevent traversal attacks
4. **File Type Restrictions**: Only allowed file types can be uploaded
5. **Size Limits**: Maximum file size enforced (${5}MB)
6. **Virus Scanning**: Files are scanned before storage (future enhancement)

## Maintenance:

- Regular cleanup of temp directory
- Log rotation and archival
- Backup verification
- Storage space monitoring

## Important Notes:

- Never access files directly through the filesystem in production
- Always use the FileService API for file operations
- Monitor disk space and implement rotation policies
- Ensure proper file permissions are set at the OS level

Generated on: ${new Date().toISOString()}
`;

    await writeFile(path.join(this.baseUploadDir, 'README.md'), documentation);
    console.log('✓ Directory documentation created');
  }

  /**
   * Get the configured directory paths
   */
  getDirectoryConfig(): StorageDirectoryConfig {
    return { ...this.directories };
  }

  /**
   * Cleanup temporary files older than specified hours
   */
  async cleanupTempFiles(maxAgeHours: number = 24): Promise<void> {
    try {
      const tempDir = this.directories.temp;
      const files = await fs.promises.readdir(tempDir);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.promises.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.promises.unlink(filePath);
          console.log(`Cleaned up old temp file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    directories: Record<string, { exists: boolean; fileCount: number; totalSize: number }>;
    totalFiles: number;
    totalSize: number;
  }> {
    const stats: Record<string, { exists: boolean; fileCount: number; totalSize: number }> = {};
    let totalFiles = 0;
    let totalSize = 0;

    for (const [name, dirPath] of Object.entries(this.directories)) {
      try {
        await access(dirPath);
        const files = await fs.promises.readdir(dirPath);
        let dirSize = 0;
        let fileCount = 0;

        for (const file of files) {
          const filePath = path.join(dirPath, file);
          try {
            const fileStat = await fs.promises.stat(filePath);
            if (fileStat.isFile()) {
              dirSize += fileStat.size;
              fileCount++;
            }
          } catch {
            // Skip files that can't be accessed
          }
        }

        stats[name] = { exists: true, fileCount, totalSize: dirSize };
        totalFiles += fileCount;
        totalSize += dirSize;
      } catch {
        stats[name] = { exists: false, fileCount: 0, totalSize: 0 };
      }
    }

    return { directories: stats, totalFiles, totalSize };
  }

  /**
   * Validate directory permissions and security
   */
  async validateSecurity(): Promise<{ isSecure: boolean; issues: string[] }> {
    const issues: string[] = [];

    for (const [name, dirPath] of Object.entries(this.directories)) {
      try {
        // Check if directory exists
        await access(dirPath);

        // Check if security files exist
        const securityFiles = ['.htaccess', 'index.html', 'web.config'];
        for (const secFile of securityFiles) {
          try {
            await access(path.join(dirPath, secFile));
          } catch {
            issues.push(`Missing security file ${secFile} in ${name} directory`);
          }
        }
      } catch {
        issues.push(`Directory ${name} does not exist: ${dirPath}`);
      }
    }

    return {
      isSecure: issues.length === 0,
      issues
    };
  }
}

// Export a default instance
export const fileStorageSetup = new FileStorageSetup();

