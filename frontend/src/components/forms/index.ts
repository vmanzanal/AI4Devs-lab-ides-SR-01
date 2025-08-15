// Forms Components Index
// Central export point for all form-related components

// Import components for organized access
import { FileUpload } from './FileUpload';
import { CandidateFormSimple } from './CandidateFormSimple';
import { CandidateFormContainer } from './CandidateFormContainer';

// File Upload Components
export { FileUpload } from './FileUpload';
export type { FileUploadProps } from './FileUpload';

// Candidate Form Components (temporarily disabled due to Grid compatibility issues)
// export { CandidateForm } from './CandidateForm';
// export type { CandidateFormProps } from './CandidateForm';

export { CandidateFormSimple } from './CandidateFormSimple';
export type { CandidateFormSimpleProps } from './CandidateFormSimple';

export { CandidateFormContainer } from './CandidateFormContainer';
export type { CandidateFormContainerProps } from './CandidateFormContainer';

// Re-export for convenience
export const FormComponents = {
  FileUpload,
  // CandidateForm, // temporarily disabled
  CandidateFormSimple,
  CandidateFormContainer
};

// Form categories for organized access
export const UploadComponents = {
  FileUpload
};

export const CandidateComponents = {
  // CandidateForm, // temporarily disabled
  CandidateFormSimple,
  CandidateFormContainer
};
