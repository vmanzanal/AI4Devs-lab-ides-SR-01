// Candidate Form Container
// Higher-order component with submission logic and state management

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Snackbar, Alert } from '@mui/material';

import { CandidateFormSimple as CandidateForm } from './CandidateFormSimple';
import { Loading } from '../common';
import { usePermissions } from '../../hooks';
import { candidateService } from '../../services';
import { errorHandler } from '../../utils/errorHandler';

import {
  Candidate,
  CreateCandidateDto,
  UpdateCandidateDto
} from '../../types/candidate.types';
import { ApiError } from '../../types/api.types';

export interface CandidateFormContainerProps {
  // Form mode and data
  mode: 'create' | 'edit';
  candidateId?: number;
  candidate?: Candidate;
  
  // Navigation
  onSuccess?: (candidate: Candidate) => void;
  onCancel?: () => void;
  successRedirectPath?: string;
  cancelRedirectPath?: string;
  
  // UI customization
  title?: string;
  showFileUpload?: boolean;
  showAdvancedFields?: boolean;
  maxWidth?: number | string;
  elevation?: number;
  
  // Loading state
  initialLoading?: boolean;
}

export const CandidateFormContainer: React.FC<CandidateFormContainerProps> = ({
  mode,
  candidateId,
  candidate: propCandidate,
  onSuccess,
  onCancel,
  successRedirectPath,
  cancelRedirectPath = '/candidates',
  title,
  showFileUpload = true,
  showAdvancedFields = true,
  maxWidth = 800,
  elevation = 1,
  initialLoading = false
}) => {
  const navigate = useNavigate();
  const { canCreateCandidate, canUpdateCandidate } = usePermissions();

  // State
  const [candidate, setCandidate] = useState<Candidate | undefined>(propCandidate);
  const [loading, setLoading] = useState(initialLoading);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Load candidate for edit mode
  React.useEffect(() => {
    const loadCandidate = async () => {
      if (mode === 'edit' && candidateId && !propCandidate) {
        setLoading(true);
        try {
          const loadedCandidate = await candidateService.getCandidateById(candidateId);
          setCandidate(loadedCandidate);
        } catch (error) {
          const processedError = errorHandler.processApiError(error as ApiError);
          setNotification({
            open: true,
            message: `Failed to load candidate: ${processedError.message}`,
            severity: 'error'
          });
          
          // Redirect to candidates list on error
          navigate(cancelRedirectPath);
        } finally {
          setLoading(false);
        }
      }
    };

    loadCandidate();
  }, [mode, candidateId, propCandidate, navigate, cancelRedirectPath]);

  // Handle form submission
  const handleSubmit = useCallback(async (
    formData: CreateCandidateDto | UpdateCandidateDto,
    cvFile?: File
  ) => {
    setSubmitting(true);
    
    try {
      let result: Candidate;
      
      if (mode === 'create') {
        // Check permission
        if (!canCreateCandidate) {
          throw new Error('You do not have permission to create candidates');
        }
        
        // Create candidate
        result = await candidateService.createCandidate(formData as CreateCandidateDto);
        
        // Upload CV if provided
        if (cvFile && result.id) {
          try {
            await candidateService.uploadCV(result.id, cvFile);
            // Reload candidate to get updated CV info
            result = await candidateService.getCandidateById(result.id);
          } catch (cvError) {
            console.warn('Failed to upload CV:', cvError);
            setNotification({
              open: true,
              message: 'Candidate created successfully, but CV upload failed. You can upload it later.',
              severity: 'warning'
            });
          }
        }
        
        setNotification({
          open: true,
          message: 'Candidate created successfully!',
          severity: 'success'
        });
        
      } else {
        // Check permission
        if (!canUpdateCandidate) {
          throw new Error('You do not have permission to update candidates');
        }
        
        // Update candidate
        const updateData = formData as UpdateCandidateDto;
        result = await candidateService.updateCandidate(updateData.id!, updateData);
        
        // Upload CV if provided
        if (cvFile && result.id) {
          try {
            await candidateService.uploadCV(result.id, cvFile);
            // Reload candidate to get updated CV info
            result = await candidateService.getCandidateById(result.id);
          } catch (cvError) {
            console.warn('Failed to upload CV:', cvError);
            setNotification({
              open: true,
              message: 'Candidate updated successfully, but CV upload failed. You can upload it later.',
              severity: 'warning'
            });
          }
        }
        
        setNotification({
          open: true,
          message: 'Candidate updated successfully!',
          severity: 'success'
        });
      }
      
      // Update local state
      setCandidate(result);
      
      // Call success callback
      onSuccess?.(result);
      
      // Navigate if path provided
      if (successRedirectPath) {
        setTimeout(() => {
          navigate(successRedirectPath);
        }, 1500);
      }
      
    } catch (error) {
      const processedError = errorHandler.processApiError(error as ApiError);
      
      setNotification({
        open: true,
        message: `${mode === 'create' ? 'Creation' : 'Update'} failed: ${processedError.message}`,
        severity: 'error'
      });
      
      // Re-throw for form-level error handling
      throw error;
      
    } finally {
      setSubmitting(false);
    }
  }, [mode, canCreateCandidate, canUpdateCandidate, onSuccess, navigate, successRedirectPath]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else if (cancelRedirectPath) {
      navigate(cancelRedirectPath);
    }
  }, [onCancel, navigate, cancelRedirectPath]);

  // Handle notification close
  const handleNotificationClose = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Show loading spinner while loading candidate
  if (loading) {
    return (
      <Loading
        type="circular"
        text={`Loading ${mode === 'edit' ? 'candidate...' : 'form...'}`}
        centered
        fullWidth
      />
    );
  }

  // Show error if candidate not found in edit mode
  if (mode === 'edit' && !candidate) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error">
          Candidate not found. Please check the URL or contact support.
        </Alert>
      </Box>
    );
  }

  return (
    <>
      <CandidateForm
        mode={mode}
        candidate={candidate}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={submitting}
        title={title}
        showFileUpload={showFileUpload}
        showAdvancedFields={showAdvancedFields}
        maxWidth={maxWidth}
        elevation={elevation}
      />

      {/* Success/Error Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleNotificationClose}
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CandidateFormContainer;
