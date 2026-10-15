import { useState } from 'react';
import { Alert, Box, Button, Link as MuiLink, TextField, Typography } from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { ROUTES } from '../../../app/navigation';
import { useAuthStore, useSystemLogStore } from '../../../stores';
import { UNIVERSITY_EMAIL_SUFFIX } from '../../../utils/constants';
import type { LoginFormErrors, LoginFormValues } from '../../../types';
import { AuthLayout } from './AuthLayout';
import { validateLogin } from './validation';

const EMPTY_FORM: LoginFormValues = { email: '', password: '' };

/** Where RequireAuth stashes the page the user was trying to reach. */
interface RedirectState {
  from?: string;
}

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const submitting = useAuthStore((s) => s.submitting);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [values, setValues] = useState<LoginFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<LoginFormErrors>({});

  const update = (patch: Partial<LoginFormValues>) => {
    if (error) clearError();
    setValues((current) => ({ ...current, ...patch }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validateLogin(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    if (await login({ email: values.email.trim(), password: values.password })) {
      useSystemLogStore.getState().addLog({
        level: 'info',
        category: 'auth',
        code: 'AUTH_LOGIN_SUCCESS',
        message: `Staff member signed in successfully: ${values.email.trim()}`,
        actor: values.email.trim(),
        details: JSON.stringify({ email: values.email.trim(), method: 'JWT Credentials' }, null, 2),
      });
      // Back to whatever was being opened before the redirect, or the courses page.
      const target = (location.state as RedirectState | null)?.from ?? ROUTES.courses;
      void navigate(target, { replace: true });
    }
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Course and student records are only visible to signed-in staff."
      footer={
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          No account yet?{' '}
          <MuiLink component={Link} to={ROUTES.register} underline="hover">
            Register
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
          type="email"
          label="University email"
          placeholder={`name${UNIVERSITY_EMAIL_SUFFIX}`}
          autoComplete="username"
          value={values.email}
          onChange={(e) => update({ email: e.target.value })}
          error={!!errors.email}
          helperText={errors.email}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          margin="dense"
          type="password"
          label="Password"
          autoComplete="current-password"
          value={values.password}
          onChange={(e) => update({ password: e.target.value })}
          error={!!errors.password}
          helperText={errors.password}
          sx={{ mb: 3 }}
        />

        <Button type="submit" fullWidth variant="contained" size="large" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </Box>
    </AuthLayout>
  );
}
