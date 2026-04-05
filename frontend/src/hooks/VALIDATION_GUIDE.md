# Enhanced Form Validation Guide

This guide explains how to use the new enhanced form validation system that provides real-time validation, server-side error handling, and visual feedback.

## Overview

The enhanced validation system integrates `react-hook-form` with custom server error handling to provide:

- **Real-time validation**: Validate fields as users type or blur
- **Server-side error propagation**: Display backend validation errors in form fields
- **Visual feedback**: Success and error messages with animations
- **Dynamic error clearing**: Errors clear when users start correcting them
- **Type-safe**: Full TypeScript support (when using .tsx files)

## Components

### 1. `useEnhancedForm` Hook

The main hook that provides form state management and validation.

```jsx
import { useEnhancedForm } from '../../hooks/useEnhancedForm';

const MyForm = ({ onSubmit }) => {
  const {
    register,           // Register form fields
    handleSubmit,       // Handle form submission
    getFieldError,      // Get error for a field (client or server)
    hasFieldError,      // Check if field has error
    clearServerError,   // Clear server error for a field
    clearAllServerErrors, // Clear all server errors
    formError,          // Form-level error
    submitSuccess,      // Success state
    clearSuccess,       // Clear success state
    isSubmitting,       // Submission state
    reset,              // Reset form
    ...formMethods      // All react-hook-form methods
  } = useEnhancedForm({
    defaultValues: { email: '', password: '' },
    onSubmit: async (data) => {
      // Your submission logic
      await apiCall(data);
    },
    mode: 'onBlur' // Validation mode (onBlur, onChange, onSubmit)
  });

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};
```

### 2. `EnhancedInput` Component

Input component with validation support.

```jsx
import EnhancedInput from '../common/EnhancedInput';

<EnhancedInput
  label="Email"
  type="email"
  error={getFieldError('email')}
  required
  {...register('email', {
    required: 'Email is required',
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Enter a valid email'
    },
    onChange: () => clearServerError('email')
  })}
/>
```

### 3. `EnhancedSelect` Component

Select component with validation support.

```jsx
import EnhancedSelect from '../common/EnhancedSelect';

<EnhancedSelect
  label="Gender"
  options={[
    { value: 'M', label: 'Male' },
    { value: 'F', label: 'Female' }
  ]}
  error={getFieldError('gender')}
  required
  {...register('gender', {
    required: 'Gender is required',
    onChange: () => clearServerError('gender')
  })}
/>
```

### 4. `FormError` Component

Display form-level errors.

```jsx
import FormError from '../common/FormError';

<FormError error={formError} onClose={clearAllServerErrors} />
```

### 5. `SuccessFeedback` Component

Display success messages.

```jsx
import SuccessFeedback from '../common/SuccessFeedback';

<SuccessFeedback 
  message="Form submitted successfully!" 
  show={submitSuccess} 
  onClose={clearSuccess}
/>
```

## Complete Example

```jsx
import { useEnhancedForm } from '../../hooks/useEnhancedForm';
import EnhancedInput from '../common/EnhancedInput';
import EnhancedSelect from '../common/EnhancedSelect';
import Button from '../common/Button';
import FormError from '../common/FormError';
import SuccessFeedback from '../common/SuccessFeedback';

const StudentForm = ({ onSubmit, loading }) => {
  const {
    register,
    handleSubmit,
    getFieldError,
    clearServerError,
    formError,
    clearAllServerErrors,
    submitSuccess,
    clearSuccess,
    reset
  } = useEnhancedForm({
    defaultValues: {
      student_school_id: '',
      full_name: '',
      gender: ''
    },
    onSubmit: async (values) => {
      await onSubmit(values);
      reset(); // Reset after success
    }
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form-level error */}
      <FormError error={formError} onClose={clearAllServerErrors} />
      
      {/* Success feedback */}
      <SuccessFeedback 
        message="Student saved successfully!" 
        show={submitSuccess} 
        onClose={clearSuccess}
      />

      <div className="grid gap-3 md:grid-cols-3">
        <EnhancedInput
          label="School ID"
          error={getFieldError('student_school_id')}
          required
          {...register('student_school_id', {
            required: 'School ID is required',
            onChange: () => clearServerError('student_school_id')
          })}
        />

        <EnhancedInput
          label="Full Name"
          error={getFieldError('full_name')}
          required
          {...register('full_name', {
            required: 'Full name is required',
            minLength: {
              value: 2,
              message: 'Name must be at least 2 characters'
            },
            onChange: () => clearServerError('full_name')
          })}
        />

        <EnhancedSelect
          label="Gender"
          options={[
            { value: 'M', label: 'Male' },
            { value: 'F', label: 'Female' }
          ]}
          error={getFieldError('gender')}
          required
          {...register('gender', {
            required: 'Gender is required',
            onChange: () => clearServerError('gender')
          })}
        />
      </div>

      <Button type="submit" loading={loading}>
        Save Student
      </Button>
    </form>
  );
};

export default StudentForm;
```

## Validation Rules

### Built-in Rules

- `required`: Field is required
- `minLength`: Minimum length
- `maxLength`: Maximum length
- `min`: Minimum value (numbers)
- `max`: Maximum value (numbers)
- `pattern`: Regex pattern
- `validate`: Custom validation function

### Custom Validation

```jsx
{...register('email', {
  validate: {
    notGmail: (value) => 
      !value.includes('@gmail.com') || 'Gmail addresses not allowed',
    unique: async (value) => {
      const exists = await checkEmailExists(value);
      return !exists || 'Email already exists';
    }
  }
})}
```

## Server Error Handling

The system automatically handles server validation errors:

1. **400 errors**: Parsed and mapped to form fields
2. **Field-specific errors**: Displayed under the relevant field
3. **General errors**: Displayed as form-level errors
4. **Auto-clearing**: Errors clear when user starts typing

### Server Error Format

The backend should return errors in this format:

```json
{
  "error": "Email is required"
}
```

The system will try to map the error message to the appropriate field based on field names in the message.

## Best Practices

1. **Always clear server errors on change**:
   ```jsx
   onChange: () => clearServerError('fieldName')
   ```

2. **Use appropriate validation modes**:
   - `onBlur`: Best for most forms (validates when user leaves field)
   - `onChange`: For real-time validation (can be distracting)
   - `onSubmit`: Only validate on submit (less user-friendly)

3. **Provide clear error messages**:
   ```jsx
   required: 'Email is required' // Good
   required: true // Bad (generic message)
   ```

4. **Reset form after successful submission**:
   ```jsx
   onSubmit: async (values) => {
     await apiCall(values);
     reset(); // Clear form
   }
   ```

5. **Handle loading states**:
   ```jsx
   <Button type="submit" loading={isSubmitting}>
     Submit
   </Button>
   ```

## Migration from Old Forms

To migrate existing forms:

1. Replace `useForm` with `useEnhancedForm`
2. Replace `Input` with `EnhancedInput`
3. Replace `Select` with `EnhancedSelect`
4. Add `FormError` and `SuccessFeedback` components
5. Update field registration to use `register` with validation rules
6. Add `clearServerError` to onChange handlers

### Before:

```jsx
const form = useForm({
  initialValues: { email: '' },
  validate: (values) => validateForm('login', values),
  onSubmit
});

<Input
  name="email"
  value={form.values.email}
  onChange={form.handleChange}
  error={form.errors.email}
/>
```

### After:

```jsx
const { register, getFieldError, clearServerError } = useEnhancedForm({
  defaultValues: { email: '' },
  onSubmit
});

<EnhancedInput
  error={getFieldError('email')}
  {...register('email', {
    required: 'Email is required',
    onChange: () => clearServerError('email')
  })}
/>
```

## Testing

The validation system includes property-based tests to ensure server errors are properly propagated to the UI. See `frontend/src/__tests__/validation/server-error-propagation.property.test.jsx` for examples.
