// Components Index
// Central export point for all reusable components

// Import components for organized access
import { 
  Button, 
  PrimaryButton,
  SecondaryButton,
  ErrorButton,
  WarningButton,
  SuccessButton,
  TextButton,
  GradientButton
} from './Button';
import { 
  Input,
  PasswordInput,
  EmailInput,
  NumberInput,
  PhoneInput,
  SearchInput,
  TextArea
} from './Input';
import { 
  Select,
  SimpleSelect,
  MultiSelect,
  GroupedSelect
} from './Select';
import { 
  ValidationMessage,
  ErrorMessage,
  WarningMessage,
  SuccessMessage,
  InfoMessage,
  FormValidationSummary,
  FieldValidation
} from './ValidationMessage';
import { 
  Loading,
  CircularLoading,
  LinearLoading,
  SkeletonLoading,
  InlineLoading,
  OverlayLoading,
  FullScreenLoading,
  PageLoading,
  TableSkeleton,
  CardSkeleton
} from './Loading';
import FileValidationDisplay from './FileValidationDisplay';
import UploadProgress from './UploadProgress';
import UploadErrorBoundary, { withUploadErrorBoundary } from './UploadErrorBoundary';

// Button Components
export {
  Button,
  PrimaryButton,
  SecondaryButton,
  ErrorButton,
  WarningButton,
  SuccessButton,
  TextButton,
  GradientButton
} from './Button';
export type { ButtonProps } from './Button';

// Input Components
export {
  Input,
  PasswordInput,
  EmailInput,
  NumberInput,
  PhoneInput,
  SearchInput,
  TextArea
} from './Input';
export type { InputProps } from './Input';

// Select Components
export {
  Select,
  SimpleSelect,
  MultiSelect,
  GroupedSelect,
  createSelectOptions,
  createGroupedOptions
} from './Select';
export type { SelectProps, SelectOption } from './Select';

// Validation Components
export {
  ValidationMessage,
  ErrorMessage,
  WarningMessage,
  SuccessMessage,
  InfoMessage,
  FormValidationSummary,
  FieldValidation
} from './ValidationMessage';
export type {
  ValidationMessageProps,
  FormValidationSummaryProps,
  FieldValidationProps
} from './ValidationMessage';

// Loading Components
export {
  Loading,
  CircularLoading,
  LinearLoading,
  SkeletonLoading,
  InlineLoading,
  OverlayLoading,
  FullScreenLoading,
  PageLoading,
  TableSkeleton,
  CardSkeleton
} from './Loading';
export type { LoadingProps, PageLoadingProps } from './Loading';

// File Upload Components
export { default as FileValidationDisplay } from './FileValidationDisplay';
export type { FileValidationDisplayProps } from './FileValidationDisplay';
export { default as UploadProgress } from './UploadProgress';
export type { UploadProgressProps } from './UploadProgress';
export { default as UploadErrorBoundary, withUploadErrorBoundary } from './UploadErrorBoundary';

// Re-export for convenience
export const CommonComponents = {
  Button,
  Input,
  Select,
  ValidationMessage,
  Loading
};

// Component categories for organized access
export const Inputs = {
  Input,
  PasswordInput,
  EmailInput,
  NumberInput,
  PhoneInput,
  SearchInput,
  TextArea,
  Select,
  SimpleSelect,
  MultiSelect,
  GroupedSelect
};

export const Buttons = {
  Button,
  PrimaryButton,
  SecondaryButton,
  ErrorButton,
  WarningButton,
  SuccessButton,
  TextButton,
  GradientButton
};

export const Validation = {
  ValidationMessage,
  ErrorMessage,
  WarningMessage,
  SuccessMessage,
  InfoMessage,
  FormValidationSummary,
  FieldValidation
};

export const LoadingComponents = {
  Loading,
  CircularLoading,
  LinearLoading,
  SkeletonLoading,
  InlineLoading,
  OverlayLoading,
  FullScreenLoading,
  PageLoading,
  TableSkeleton,
  CardSkeleton
};
