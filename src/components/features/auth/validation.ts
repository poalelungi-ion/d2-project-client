import {
  MAX_PASSWORD_BYTES,
  MIN_PASSWORD_LENGTH,
  UNIVERSITY_EMAIL_SUFFIX,
  isUniversityEmail,
} from '../../../utils/constants';
import type {
  LoginFormErrors,
  LoginFormValues,
  RegisterFormErrors,
  RegisterFormValues,
} from '../../../types';

/** Byte length, because bcrypt's 72-byte cap is not a character count. */
const byteLength = (value: string): number => new TextEncoder().encode(value).length;

export const validateLogin = (values: LoginFormValues): LoginFormErrors => {
  const errors: LoginFormErrors = {};
  if (!values.email.trim()) errors.email = 'Email is required';
  if (!values.password) errors.password = 'Password is required';
  return errors;
};

export const validateRegistration = (values: RegisterFormValues): RegisterFormErrors => {
  const errors: RegisterFormErrors = {};

  if (!values.name.trim()) errors.name = 'Name is required';

  if (!values.email.trim()) {
    errors.email = 'Email is required';
  } else if (!isUniversityEmail(values.email)) {
    errors.email = `Use your university address, ending in ${UNIVERSITY_EMAIL_SUFFIX}`;
  }

  if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters`;
  } else if (byteLength(values.password) > MAX_PASSWORD_BYTES) {
    errors.password = `Too long -- at most ${MAX_PASSWORD_BYTES} bytes`;
  }

  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
};
