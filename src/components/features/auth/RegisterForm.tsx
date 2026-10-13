import { useState } from 'react';
import { Alert, Box, Button, Link as MuiLink, TextField, Typography } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

import { ROUTES } from '../../../app/navigation';
import { useAuthStore } from '../../../stores';
import { MIN_PASSWORD_LENGTH, UNIVERSITY_EMAIL_SUFFIX } from '../../../utils/constants';
import type { RegisterFormErrors, RegisterFormValues } from '../../../types';
import { AuthLayout } from './AuthLayout';
import { validateRegistration } from './validation';

const EMPTY_FORM: RegisterFormValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export function RegisterForm() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const submitting = useAuthStore((s) => s.submitting);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [values, setValues] = useState<RegisterFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<RegisterFormErrors>({});

  const update = (patch: Partial<RegisterFormValues>) => {
    if (error) clearError();
    setValues((current) => ({ ...current, ...patch }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validateRegistration(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const created = await register({
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
    });
    // register signs in on success, so there is no second password prompt.
    if (created) void navigate(ROUTES.courses, { replace: true });
  };

  return (
    <AuthLayout
      title="Create an account"
      subtitle={`Registration is open to ${UNIVERSITY_EMAIL_SUFFIX} addresses.`}
      footer={
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Already have an account?{' '}
          <MuiLink component={Link} to={ROUTES.login} underline="hover">
            Sign in
          </MuiLink>
        </Typography>
      }
    >
      <Box component="form" onSubmit={(e) => void handleSubmit(e)} noValidate>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          autoFocus
          fullWidth
          margin="dense"
          label="Full name"
          autoComplete="name"
          value={values.name}
          onChange={(e) => update({ name: e.target.value })}
          error={!!errors.name}
          helperText={errors.name}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          margin="dense"
          type="email"
          label="University email"
          placeholder={`name${UNIVERSITY_EMAIL_SUFFIX}`}
          autoComplete="username"
          value={values.email}
          onChange={(e) => update({ email: e.target.value })}
          error={!!errors.email}
          helperText={errors.email ?? `Must end in ${UNIVERSITY_EMAIL_SUFFIX}`}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          margin="dense"
          type="password"
          label="Password"
          autoComplete="new-password"
          value={values.password}
          onChange={(e) => update({ password: e.target.value })}
          error={!!errors.password}
          helperText={errors.password ?? `At least ${MIN_PASSWORD_LENGTH} characters`}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          margin="dense"
          type="password"
          label="Confirm password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={(e) => update({ confirmPassword: e.target.value })}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword}
          sx={{ mb: 3 }}
        />

        <Button type="submit" fullWidth variant="contained" size="large" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
        </Button>
      </Box>
    </AuthLayout>
  );
}
