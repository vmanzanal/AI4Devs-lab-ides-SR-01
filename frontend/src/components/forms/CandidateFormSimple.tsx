// Simplified Candidate Form Component
// Basic form for creating and editing candidates without Grid layout

import React, { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Collapse
} from '@mui/material';
import {
  Person as PersonIcon,
  Work as WorkIcon,
  School as EducationIcon,
  Description as FileIcon,
  Notes as NotesIcon
} from '@mui/icons-material';

// Internal imports
import { 
  Input,
  Select,
  TextArea,
  Button,
  ValidationMessage,
  createSelectOptions 
} from '../common';
import { FileUpload } from './FileUpload';
import { usePermissions } from '../../hooks';

// Types and validation
import {
  CandidateFormData,
  CreateCandidateDto,
  UpdateCandidateDto,
  Candidate,
  ExperienceLevel,
  ExperienceLevelLabels
} from '../../types/candidate.types';
import {
  defaultCandidateFormValues,
  getFieldValidationState,
  getFieldStrength
} from '../../validation/candidateValidation';
import { ApiError } from '../../types/api.types';
import { errorHandler } from '../../utils/errorHandler';
import { candidateService } from '../../services';

export interface CandidateFormSimpleProps {
  // Form mode
  mode: 'create' | 'edit';
  candidate?: Candidate;
  
  // Form handling
  onSubmit: (data: CreateCandidateDto | UpdateCandidateDto, file?: File) => Promise<void>;
  onCancel?: () => void;
  
  // UI state
  loading?: boolean;
  disabled?: boolean;
  
  // Customization
  title?: string;
  showFileUpload?: boolean;
  showAdvancedFields?: boolean;
  
  // Layout
  maxWidth?: number | string;
  elevation?: number;
}

export const CandidateFormSimple: React.FC<CandidateFormSimpleProps> = ({
  mode,
  candidate,
  onSubmit,
  onCancel,
  loading = false,
  disabled = false,
  title,
  showFileUpload = true,
  showAdvancedFields = true,
  maxWidth = 800,
  elevation = 1
}) => {
  const { canUploadCV, canDownloadCV } = usePermissions();
  
  // Form setup
  const isEditing = mode === 'edit';
  
  const defaultValues = useMemo(() => {
    if (isEditing && candidate) {
      return {
        firstName: candidate.firstName || '',
        lastName: candidate.lastName || '',
        email: candidate.email || '',
        phone: candidate.phone || '',
        address: candidate.address || '',
        position: candidate.position || '',
        experienceLevel: candidate.experienceLevel || ('' as ExperienceLevel | ''),
        skills: candidate.skills || '',
        education: candidate.education || '',
        workExperience: candidate.workExperience || '',
        notes: candidate.notes || '',
        cvFile: undefined
      };
    }
    return defaultCandidateFormValues;
  }, [isEditing, candidate]);

  const {
    control,
    handleSubmit,
    formState: { errors, touchedFields, isSubmitting, isValid },
    reset,
    setValue,
    watch,
    setError,
    clearErrors
  } = useForm<CandidateFormData>({
    defaultValues,
    mode: 'onChange',
    // Note: Using client-side validation instead of yup resolver for now
    // resolver: yupResolver(createCandidateSchema),
    reValidateMode: 'onChange'
  });

  // Watch form values for validation feedback
  const watchedValues = watch();

  // Reset form when candidate changes
  useEffect(() => {
    if (candidate) {
      reset(defaultValues);
    }
  }, [candidate, reset, defaultValues]);

  // Experience level options
  const experienceLevelOptions = createSelectOptions(ExperienceLevelLabels);

  // Handle form submission
  const handleFormSubmit = async (formData: CandidateFormData) => {
    try {
      clearErrors();
      
      // Prepare submission data
      const submissionData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone?.trim() || null,
        address: formData.address?.trim() || null,
        position: formData.position.trim(),
        experienceLevel: formData.experienceLevel as ExperienceLevel,
        skills: formData.skills?.trim() || null,
        education: formData.education?.trim() || null,
        workExperience: formData.workExperience?.trim() || null,
        notes: formData.notes?.trim() || null
      };

      // Add ID for edit mode
      const finalData = isEditing && candidate 
        ? { id: candidate.id, ...submissionData } as UpdateCandidateDto
        : submissionData as CreateCandidateDto;

      // Call parent submit handler
      await onSubmit(finalData, formData.cvFile);

    } catch (error) {
      const processedError = errorHandler.processApiError(error as ApiError);
      
      // Handle field-specific errors
      if (processedError.message.toLowerCase().includes('email')) {
        setError('email', {
          type: 'server',
          message: processedError.message
        });
      }
    }
  };

  // Handle file upload
  const handleFileChange = (file: File | null) => {
    setValue('cvFile', file || undefined, { shouldValidate: true });
  };

  // Handle existing CV file deletion
  const handleExistingFileDelete = async () => {
    if (!candidate?.id) return;
    
    try {
      await candidateService.deleteCV(candidate.id);
    } catch (error) {
      console.error('Failed to delete CV:', error);
    }
  };

  // Get field validation state helper with enhanced feedback
  const getValidationState = (fieldName: keyof CandidateFormData) => {
    const baseValidation = getFieldValidationState(
      fieldName,
      watchedValues[fieldName],
      errors,
      touchedFields
    );
    
    // Add validation strength for specific fields
    const strength = ['firstName', 'lastName', 'email', 'phone', 'position', 'skills'].includes(fieldName)
      ? getFieldStrength(fieldName as any, watchedValues[fieldName])
      : undefined;
    
    return {
      ...baseValidation,
      validationStrength: strength,
      showValidationStrength: !!strength && !!watchedValues[fieldName]?.toString().trim(),
      enableRealTimeValidation: true
    };
  };
  
  // Note: getCharacterInfo utility available for future enhancements
  // const getCharacterInfo = (fieldName: keyof CandidateFormData, maxLength: number, minLength?: number) => {
  //   const value = watchedValues[fieldName]?.toString() || '';
  //   return getCharacterCountInfo(value, maxLength, minLength);
  // };

  // Form title
  const formTitle = title || (isEditing ? 'Edit Candidate' : 'Add New Candidate');

  return (
    <Paper elevation={elevation} sx={{ maxWidth, mx: 'auto', p: 3 }}>
      {/* Form Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon />
          {formTitle}
        </Typography>
        {isEditing && candidate && (
          <Typography variant="body2" color="text.secondary">
            Editing candidate: {candidate.firstName} {candidate.lastName}
          </Typography>
        )}
      </Box>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          {/* Personal Information Section */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PersonIcon color="primary" />
              <Typography variant="h6">Personal Information</Typography>
            </Box>
            
            {/* Name Fields */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Box sx={{ flex: 1 }}>
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="First Name"
                      placeholder="Enter first name"
                      required
                      disabled={disabled || loading}
                      {...getValidationState('firstName')}
                    />
                  )}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Last Name"
                      placeholder="Enter last name"
                      required
                      disabled={disabled || loading}
                      {...getValidationState('lastName')}
                    />
                  )}
                />
              </Box>
            </Box>

            {/* Contact Fields */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Box sx={{ flex: 1 }}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="email"
                      label="Email Address"
                      placeholder="Enter email address"
                      required
                      disabled={disabled || loading}
                      {...getValidationState('email')}
                    />
                  )}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="tel"
                      label="Phone Number"
                      placeholder="Enter phone number"
                      disabled={disabled || loading}
                      {...getValidationState('phone')}
                    />
                  )}
                />
              </Box>
            </Box>

            {/* Address */}
            <Box sx={{ mb: 2 }}>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label="Address"
                    placeholder="Enter full address"
                    multiline
                    rows={2}
                    disabled={disabled || loading}
                    {...getValidationState('address')}
                  />
                )}
              />
            </Box>
          </Box>

          {/* Professional Information Section */}
          <Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <WorkIcon color="primary" />
              <Typography variant="h6">Professional Information</Typography>
            </Box>

            {/* Position and Experience */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Box sx={{ flex: 1 }}>
                <Controller
                  name="position"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Position"
                      placeholder="Enter desired position"
                      required
                      disabled={disabled || loading}
                      {...getValidationState('position')}
                    />
                  )}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Controller
                  name="experienceLevel"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      label="Experience Level"
                      placeholder="Select experience level"
                      options={experienceLevelOptions}
                      required
                      disabled={disabled || loading}
                      {...getValidationState('experienceLevel')}
                    />
                  )}
                />
              </Box>
            </Box>

            {/* Skills */}
            <Box sx={{ mb: 2 }}>
              <Controller
                name="skills"
                control={control}
                render={({ field }) => (
                  <TextArea
                    {...field}
                    label="Skills"
                    placeholder="Enter relevant skills (e.g., JavaScript, React, Node.js, etc.)"
                    rows={3}
                    disabled={disabled || loading}
                    showCharacterCount
                    maxLength={1000}
                    minLength={5}
                    {...getValidationState('skills')}
                  />
                )}
              />
            </Box>
          </Box>

          {/* Advanced Fields */}
          {showAdvancedFields && (
            <Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <EducationIcon color="primary" />
                <Typography variant="h6">Education & Experience</Typography>
              </Box>

              {/* Education */}
              <Box sx={{ mb: 2 }}>
                <Controller
                  name="education"
                  control={control}
                  render={({ field }) => (
                                      <TextArea
                    {...field}
                    label="Education"
                    placeholder="Enter educational background (degree, institution, year, etc.)"
                    rows={3}
                    disabled={disabled || loading}
                    showCharacterCount
                    maxLength={1000}
                    minLength={10}
                    {...getValidationState('education')}
                  />
                  )}
                />
              </Box>

              {/* Work Experience */}
              <Box sx={{ mb: 2 }}>
                <Controller
                  name="workExperience"
                  control={control}
                  render={({ field }) => (
                                      <TextArea
                    {...field}
                    label="Work Experience"
                    placeholder="Enter previous work experience (company, role, duration, responsibilities, etc.)"
                    rows={4}
                    disabled={disabled || loading}
                    showCharacterCount
                    maxLength={2000}
                    minLength={10}
                    {...getValidationState('workExperience')}
                  />
                  )}
                />
              </Box>
            </Box>
          )}

          {/* CV Upload Section */}
          {showFileUpload && canUploadCV && (
            <Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <FileIcon color="primary" />
                <Typography variant="h6">CV/Resume</Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Controller
                  name="cvFile"
                  control={control}
                  render={({ field }) => (
                    <FileUpload
                      file={field.value || null}
                      existingFile={
                        candidate?.cvFileName && candidate?.cvFilePath
                          ? {
                              fileName: candidate.cvFileName,
                              fileSize: 0,
                              downloadUrl: canDownloadCV ? `/api/candidates/${candidate.id}/cv` : undefined
                            }
                          : undefined
                      }
                      onFileChange={handleFileChange}
                      onExistingFileDelete={handleExistingFileDelete}
                      disabled={disabled || loading}
                      error={!!errors.cvFile}
                      errorText={errors.cvFile?.message}
                    />
                  )}
                />
              </Box>
            </Box>
          )}

          {/* Notes Section */}
          <Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <NotesIcon color="primary" />
              <Typography variant="h6">Additional Notes</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextArea
                    {...field}
                    label="Notes"
                    placeholder="Enter any additional notes or comments about the candidate"
                    rows={3}
                    disabled={disabled || loading}
                    showCharacterCount
                    maxLength={1000}
                    {...getValidationState('notes')}
                  />
                )}
              />
            </Box>
          </Box>

          {/* Form Actions */}
          <Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              {onCancel && (
                <Button
                  variant="outlined"
                  onClick={onCancel}
                  disabled={loading || isSubmitting}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                variant="contained"
                loading={loading || isSubmitting}
                loadingText={isEditing ? 'Updating...' : 'Creating...'}
                disabled={disabled || (!isValid && Object.keys(touchedFields).length > 0)}
              >
                {isEditing ? 'Update Candidate' : 'Create Candidate'}
              </Button>
            </Box>
          </Box>
        </Box>
      </form>

      {/* Form Status Messages */}
      <Collapse in={Object.keys(errors).length > 0}>
        <Box sx={{ mt: 2 }}>
          <ValidationMessage
            type="error"
            title="Please correct the following errors:"
            messages={Object.entries(errors).map(([field, error]) => 
              `${field.charAt(0).toUpperCase() + field.slice(1)}: ${error.message || 'Invalid value'}`
            )}
          />
        </Box>
      </Collapse>

      {/* Form Progress Indicator */}
      {Object.keys(touchedFields).length > 0 && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Form Progress
            </Typography>
            <Typography variant="body2" color={isValid ? 'success.main' : 'text.secondary'}>
              {Object.keys(touchedFields).length > 0 && isValid ? '✓ Ready to submit' : 'Fill required fields'}
            </Typography>
          </Box>
          <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1, height: 6 }}>
            <Box
              sx={{
                width: `${(Object.keys(touchedFields).length / 4) * 100}%`, // Based on required fields
                bgcolor: isValid ? 'success.main' : 'primary.main',
                height: '100%',
                borderRadius: 1,
                transition: 'all 0.3s ease',
              }}
            />
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default CandidateFormSimple;
