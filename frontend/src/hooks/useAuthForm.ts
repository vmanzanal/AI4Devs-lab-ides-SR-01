// Authentication Form Hook
// Handles form-specific authentication operations with validation

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { errorHandler } from '../utils/errorHandler';
import {
  LoginDto,
  RegisterDto,
  ChangePasswordDto,
  LoginFormData,
  RegisterFormData,
  ChangePasswordFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData
} from '../types/user.types';
import { ApiError } from '../types/api.types';
import { authService } from '../services/authService';

// Form submission states
export interface FormSubmissionState {
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
}

// Login form hook
export const useLoginForm = () => {
  const { login } = useAuth();
  const [state, setState] = useState<FormSubmissionState>({
    isSubmitting: false,
    isSuccess: false,
    error: null,
    fieldErrors: {}
  });

  const submitLogin = useCallback(async (formData: LoginFormData) => {
    setState(prev => ({
      ...prev,
      isSubmitting: true,
      error: null,
      fieldErrors: {}
    }));

    try {
      const loginData: LoginDto = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        rememberMe: formData.rememberMe
      };

      await login(loginData);

      setState(prev => ({
        ...prev,
        isSubmitting: false,
        isSuccess: true
      }));
    } catch (error) {
      const processedError = errorHandler.processApiError(error as ApiError);
      
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        isSuccess: false,
        error: processedError.message,
        fieldErrors: extractFieldErrors(error as ApiError)
      }));

      throw error;
    }
  }, [login]);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      fieldErrors: {}
    }));
  }, []);

  const resetForm = useCallback(() => {
    setState({
      isSubmitting: false,
      isSuccess: false,
      error: null,
      fieldErrors: {}
    });
  }, []);

  return {
    ...state,
    submitLogin,
    clearError,
    resetForm
  };
};

// Registration form hook
export const useRegistrationForm = () => {
  const { register } = useAuth();
  const [state, setState] = useState<FormSubmissionState>({
    isSubmitting: false,
    isSuccess: false,
    error: null,
    fieldErrors: {}
  });

  const submitRegistration = useCallback(async (formData: RegisterFormData) => {
    setState(prev => ({
      ...prev,
      isSubmitting: true,
      error: null,
      fieldErrors: {}
    }));

    try {
      // Validate password confirmation
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const registerData: RegisterDto = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        name: formData.name.trim() || undefined,
        role: formData.role
      };

      await register(registerData);

      setState(prev => ({
        ...prev,
        isSubmitting: false,
        isSuccess: true
      }));
    } catch (error) {
      const processedError = errorHandler.processApiError(error as ApiError);
      
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        isSuccess: false,
        error: processedError.message,
        fieldErrors: extractFieldErrors(error as ApiError)
      }));

      throw error;
    }
  }, [register]);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      fieldErrors: {}
    }));
  }, []);

  const resetForm = useCallback(() => {
    setState({
      isSubmitting: false,
      isSuccess: false,
      error: null,
      fieldErrors: {}
    });
  }, []);

  return {
    ...state,
    submitRegistration,
    clearError,
    resetForm
  };
};

// Change password form hook
export const useChangePasswordForm = () => {
  const { changePassword } = useAuth();
  const [state, setState] = useState<FormSubmissionState>({
    isSubmitting: false,
    isSuccess: false,
    error: null,
    fieldErrors: {}
  });

  const submitChangePassword = useCallback(async (formData: ChangePasswordFormData) => {
    setState(prev => ({
      ...prev,
      isSubmitting: true,
      error: null,
      fieldErrors: {}
    }));

    try {
      // Validate new password confirmation
      if (formData.newPassword !== formData.confirmNewPassword) {
        throw new Error('New passwords do not match');
      }

      const changePasswordData: ChangePasswordDto = {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      };

      await changePassword(changePasswordData);

      setState(prev => ({
        ...prev,
        isSubmitting: false,
        isSuccess: true
      }));
    } catch (error) {
      const processedError = errorHandler.processApiError(error as ApiError);
      
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        isSuccess: false,
        error: processedError.message,
        fieldErrors: extractFieldErrors(error as ApiError)
      }));

      throw error;
    }
  }, [changePassword]);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      fieldErrors: {}
    }));
  }, []);

  const resetForm = useCallback(() => {
    setState({
      isSubmitting: false,
      isSuccess: false,
      error: null,
      fieldErrors: {}
    });
  }, []);

  return {
    ...state,
    submitChangePassword,
    clearError,
    resetForm
  };
};

// Forgot password form hook
export const useForgotPasswordForm = () => {
  const [state, setState] = useState<FormSubmissionState>({
    isSubmitting: false,
    isSuccess: false,
    error: null,
    fieldErrors: {}
  });

  const submitForgotPassword = useCallback(async (formData: ForgotPasswordFormData) => {
    setState(prev => ({
      ...prev,
      isSubmitting: true,
      error: null,
      fieldErrors: {}
    }));

    try {
      await authService.requestPasswordReset(formData.email.trim().toLowerCase());

      setState(prev => ({
        ...prev,
        isSubmitting: false,
        isSuccess: true
      }));
    } catch (error) {
      const processedError = errorHandler.processApiError(error as ApiError);
      
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        isSuccess: false,
        error: processedError.message,
        fieldErrors: extractFieldErrors(error as ApiError)
      }));

      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      fieldErrors: {}
    }));
  }, []);

  const resetForm = useCallback(() => {
    setState({
      isSubmitting: false,
      isSuccess: false,
      error: null,
      fieldErrors: {}
    });
  }, []);

  return {
    ...state,
    submitForgotPassword,
    clearError,
    resetForm
  };
};

// Reset password form hook
export const useResetPasswordForm = () => {
  const [state, setState] = useState<FormSubmissionState>({
    isSubmitting: false,
    isSuccess: false,
    error: null,
    fieldErrors: {}
  });

  const submitResetPassword = useCallback(async (formData: ResetPasswordFormData) => {
    setState(prev => ({
      ...prev,
      isSubmitting: true,
      error: null,
      fieldErrors: {}
    }));

    try {
      // Validate password confirmation
      if (formData.newPassword !== formData.confirmNewPassword) {
        throw new Error('Passwords do not match');
      }

      await authService.resetPassword(formData.token, formData.newPassword);

      setState(prev => ({
        ...prev,
        isSubmitting: false,
        isSuccess: true
      }));
    } catch (error) {
      const processedError = errorHandler.processApiError(error as ApiError);
      
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        isSuccess: false,
        error: processedError.message,
        fieldErrors: extractFieldErrors(error as ApiError)
      }));

      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      fieldErrors: {}
    }));
  }, []);

  const resetForm = useCallback(() => {
    setState({
      isSubmitting: false,
      isSuccess: false,
      error: null,
      fieldErrors: {}
    });
  }, []);

  return {
    ...state,
    submitResetPassword,
    clearError,
    resetForm
  };
};

// Utility function to extract field-specific errors from API error
const extractFieldErrors = (error: ApiError): Record<string, string> => {
  const fieldErrors: Record<string, string> = {};

  // Handle validation errors with field-specific messages
  if (error.code === 'VALIDATION_ERROR' && error.details?.fields) {
    Object.entries(error.details.fields).forEach(([field, message]) => {
      fieldErrors[field] = Array.isArray(message) ? message[0] : message;
    });
  }

  // Handle common authentication field errors
  if (error.error?.toLowerCase().includes('email')) {
    fieldErrors.email = error.error;
  } else if (error.error?.toLowerCase().includes('password')) {
    fieldErrors.password = error.error;
  }

  return fieldErrors;
};

// Combined authentication forms hook
export const useAuthForms = () => {
  const loginForm = useLoginForm();
  const registrationForm = useRegistrationForm();
  const changePasswordForm = useChangePasswordForm();
  const forgotPasswordForm = useForgotPasswordForm();
  const resetPasswordForm = useResetPasswordForm();

  const clearAllErrors = useCallback(() => {
    loginForm.clearError();
    registrationForm.clearError();
    changePasswordForm.clearError();
    forgotPasswordForm.clearError();
    resetPasswordForm.clearError();
  }, [
    loginForm.clearError,
    registrationForm.clearError,
    changePasswordForm.clearError,
    forgotPasswordForm.clearError,
    resetPasswordForm.clearError
  ]);

  const resetAllForms = useCallback(() => {
    loginForm.resetForm();
    registrationForm.resetForm();
    changePasswordForm.resetForm();
    forgotPasswordForm.resetForm();
    resetPasswordForm.resetForm();
  }, [
    loginForm.resetForm,
    registrationForm.resetForm,
    changePasswordForm.resetForm,
    forgotPasswordForm.resetForm,
    resetPasswordForm.resetForm
  ]);

  return {
    login: loginForm,
    registration: registrationForm,
    changePassword: changePasswordForm,
    forgotPassword: forgotPasswordForm,
    resetPassword: resetPasswordForm,
    clearAllErrors,
    resetAllForms
  };
};

export default useAuthForms;
