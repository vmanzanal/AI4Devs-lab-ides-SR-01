// Custom Select Component
// Enhanced Material-UI Select with consistent styling and validation

import React, { forwardRef } from 'react';
import {
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  FormHelperText,
  OutlinedInput,
  Chip,
  Box,
  Typography,
  SxProps,
  Theme,
  SelectProps as MuiSelectProps
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface SelectProps extends Omit<MuiSelectProps, 'variant'> {
  // Basic props
  name: string;
  label?: string;
  placeholder?: string;
  helperText?: string;
  errorText?: string;
  successText?: string;
  
  // Options
  options: SelectOption[];
  
  // Variants
  variant?: 'outlined' | 'filled' | 'standard';
  
  // Validation states
  error?: boolean;
  success?: boolean;
  
  // Loading state
  loading?: boolean;
  
  // Size options
  size?: 'small' | 'medium';
  
  // Multi-select
  multiple?: boolean;
  
  // Custom styling
  sx?: SxProps<Theme>;
  
  // Grouped options
  groupBy?: keyof SelectOption;
  
  // Custom rendering
  renderValue?: (selected: any) => React.ReactNode;
  renderOption?: (option: SelectOption) => React.ReactNode;
  
  // Event handlers
  onChange?: (event: any, child?: React.ReactNode) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

export const Select = forwardRef<any, SelectProps>(({
  name,
  label,
  placeholder,
  helperText,
  errorText,
  successText,
  options = [],
  variant = 'outlined',
  error = false,
  success = false,
  loading = false,
  size = 'medium',
  multiple = false,
  fullWidth = true,
  required = false,
  disabled = false,
  sx,
  groupBy,
  renderValue,
  renderOption,
  value,
  defaultValue,
  onChange,
  onBlur,
  onFocus,
  ...props
}, ref) => {
  // Determine helper text to display
  const getHelperText = () => {
    if (errorText && error) return errorText;
    if (successText && success) return successText;
    return helperText;
  };

  // Group options if groupBy is specified
  const getGroupedOptions = () => {
    if (!groupBy) return { '': options };
    
    return options.reduce((groups, option) => {
      const group = option[groupBy] as string || '';
      if (!groups[group]) groups[group] = [];
      groups[group].push(option);
      return groups;
    }, {} as Record<string, SelectOption[]>);
  };

  // Default render value for multiple select
  const defaultRenderValue = (selected: any) => {
    if (!multiple) return selected;
    
    const selectedArray = Array.isArray(selected) ? selected : [];
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {selectedArray.map((value) => {
          const option = options.find(opt => opt.value === value);
          return (
            <Chip
              key={value}
              label={option?.label || value}
              size="small"
              sx={{ maxWidth: 120 }}
            />
          );
        })}
      </Box>
    );
  };

  // Default render option
  const defaultRenderOption = (option: SelectOption) => option.label;

  // Render grouped menu items
  const renderMenuItems = () => {
    const groupedOptions = getGroupedOptions();
    const groups = Object.keys(groupedOptions);
    
    return groups.map(group => {
      const groupOptions = groupedOptions[group];
      
      return [
        // Group header (if group name exists)
        group && (
          <MenuItem key={`group-${group}`} disabled sx={{ fontWeight: 'bold' }}>
            <Typography variant="subtitle2" color="textSecondary">
              {group}
            </Typography>
          </MenuItem>
        ),
        
        // Group options
        ...groupOptions.map(option => (
          <MenuItem
            key={option.value}
            value={option.value}
            disabled={option.disabled || loading}
            sx={{
              ...(group && { pl: 3 }),
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
          >
            {renderOption ? renderOption(option) : defaultRenderOption(option)}
          </MenuItem>
        ))
      ].filter(Boolean);
    }).flat();
  };

  const labelId = `${name}-label`;
  const selectId = `${name}-select`;

  return (
    <FormControl
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      error={error}
      required={required}
      disabled={disabled || loading}
      sx={sx}
    >
      {label && (
        <InputLabel
          id={labelId}
          sx={{
            // Success state styling
            ...(success && !error && {
              '&.Mui-focused': {
                color: 'success.main',
              },
            }),
          }}
        >
          {label}
        </InputLabel>
      )}
      
      <MuiSelect
        {...props}
        ref={ref}
        labelId={labelId}
        id={selectId}
        name={name}
        value={value}
        defaultValue={defaultValue}
        multiple={multiple}
        displayEmpty={!!placeholder}
        renderValue={renderValue || defaultRenderValue}
        input={variant === 'outlined' ? <OutlinedInput label={label} /> : undefined}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        sx={{
          // Success state styling
          ...(success && !error && {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'success.main',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'success.dark',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'success.main',
            },
          }),
          
          // Loading state styling
          ...(loading && {
            backgroundColor: 'action.hover',
          }),
        }}
      >
        {/* Placeholder option */}
        {placeholder && (
          <MenuItem value="" disabled>
            <Typography color="textSecondary">
              {placeholder}
            </Typography>
          </MenuItem>
        )}
        
        {/* Options */}
        {renderMenuItems()}
        
        {/* No options message */}
        {options.length === 0 && !loading && (
          <MenuItem disabled>
            <Typography color="textSecondary">
              No options available
            </Typography>
          </MenuItem>
        )}
        
        {/* Loading message */}
        {loading && (
          <MenuItem disabled>
            <Typography color="textSecondary">
              Loading...
            </Typography>
          </MenuItem>
        )}
      </MuiSelect>
      
      {/* Helper text with validation icons */}
      {(getHelperText() || error || success) && (
        <FormHelperText
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            ...(success && !error && {
              color: 'success.main',
            }),
          }}
        >
          {error && <ErrorIcon sx={{ fontSize: 16 }} />}
          {success && !error && <SuccessIcon sx={{ fontSize: 16 }} />}
          {getHelperText()}
        </FormHelperText>
      )}
    </FormControl>
  );
});

Select.displayName = 'Select';

// Preset select variants for common use cases
export const SimpleSelect: React.FC<Omit<SelectProps, 'multiple'>> = (props) => (
  <Select multiple={false} {...props} />
);

export const MultiSelect: React.FC<Omit<SelectProps, 'multiple'>> = (props) => (
  <Select multiple {...props} />
);

export const GroupedSelect: React.FC<SelectProps> = (props) => (
  <Select groupBy="group" {...props} />
);

// Helper function to create options from arrays
export const createSelectOptions = (
  items: (string | number)[] | Record<string | number, string>,
  valueKey?: string,
  labelKey?: string
): SelectOption[] => {
  if (Array.isArray(items)) {
    return items.map(item => ({
      value: item,
      label: String(item)
    }));
  }
  
  return Object.entries(items).map(([key, value]) => ({
    value: key,
    label: String(value)
  }));
};

// Helper function to create grouped options
export const createGroupedOptions = (
  groups: Record<string, (string | number)[]>
): SelectOption[] => {
  return Object.entries(groups).flatMap(([group, items]) =>
    items.map(item => ({
      value: item,
      label: String(item),
      group
    }))
  );
};

export default Select;
