# File Storage Directory Structure

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
5. **Size Limits**: Maximum file size enforced (5MB)
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

Generated on: 2025-08-15T08:26:08.758Z
