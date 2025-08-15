// Main Components Index
// Central export point for all application components

// Re-export all common components
export * from './common';

// Re-export all form components
export * from './forms';

// Re-export all candidate components
export * from './candidates';

// Component categories for organized imports
import { CommonComponents, Inputs, Buttons, Validation, LoadingComponents } from './common';
import { FormComponents, UploadComponents, CandidateComponents as FormCandidateComponents } from './forms';
import { CandidateListComponents } from './candidates';

// Organized component exports
export const Components = {
  // Common components
  ...CommonComponents,
  
  // Form components
  ...FormComponents,
  
  // Candidate components
  ...CandidateListComponents,
  
  // Organized by category
  Common: CommonComponents,
  Forms: FormComponents,
  Inputs,
  Buttons,
  Validation,
  Loading: LoadingComponents,
  Upload: UploadComponents,
  Candidate: CandidateListComponents,
  CandidateForm: FormCandidateComponents
};

// Quick access to commonly used components
export const {
  Button,
  Input,
  Select,
  ValidationMessage,
  Loading,
  CandidateFormSimple: CandidateForm, // Use simplified form as default
  CandidateFormContainer,
  FileUpload,
  CandidateCard,
  CandidateList
} = Components;
