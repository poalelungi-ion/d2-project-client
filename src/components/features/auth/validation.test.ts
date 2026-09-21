import { describe, expect, it } from 'vitest';
import { validateLogin, validateRegistration } from './validation';
import { MIN_PASSWORD_LENGTH } from '../../../utils/constants';

const VALID = {
  name: 'Anna Musterfrau',
  email: 'a.musterfrau@uni-hildesheim.de',
  password: 'correct-horse-battery',
  confirmPassword: 'correct-horse-battery',
};

describe('validateLogin', () => {
  it('passes a filled form', () => {
    expect(validateLogin({ email: VALID.email, password: VALID.password })).toEqual({});
  });

  it('flags both empty fields', () => {
    const errors = validateLogin({ email: '', password: '' });
    expect(errors.email).toBeTruthy();
    expect(errors.password).toBeTruthy();
  });

  it('does not apply the domain rule on sign-in', () => {
    // An address outside the domain simply has no account; saying so at the
    // form would tell a stranger which addresses are registered.
    expect(validateLogin({ email: 'someone@gmail.com', password: 'x' })).toEqual({});
  });
});

describe('validateRegistration', () => {
  it('passes a well-formed registration', () => {
    expect(validateRegistration(VALID)).toEqual({});
  });

  it('requires a university address', () => {
    const errors = validateRegistration({ ...VALID, email: 'someone@gmail.com' });
    expect(errors.email).toContain('@uni-hildesheim.de');
  });

  it('requires a name', () => {
    expect(validateRegistration({ ...VALID, name: '   ' }).name).toBeTruthy();
  });

  it('rejects a password below the minimum length', () => {
    const short = 'a'.repeat(MIN_PASSWORD_LENGTH - 1);
    const errors = validateRegistration({ ...VALID, password: short, confirmPassword: short });
    expect(errors.password).toBeTruthy();
  });

  it('rejects a password past the 72 bytes bcrypt can hash', () => {
    const long = 'a'.repeat(73);
    const errors = validateRegistration({ ...VALID, password: long, confirmPassword: long });
    expect(errors.password).toBeTruthy();
  });

  it('counts bytes, not characters, against the bcrypt limit', () => {
    // Each of these is one character but four UTF-8 bytes, so 20 of them are
    // 80 bytes -- past the limit even though the string looks short.
    const emoji = '🔐'.repeat(20);
    const errors = validateRegistration({ ...VALID, password: emoji, confirmPassword: emoji });
    expect(errors.password).toBeTruthy();
  });

  it('flags a mismatched confirmation', () => {
    const errors = validateRegistration({ ...VALID, confirmPassword: 'something-else' });
    expect(errors.confirmPassword).toBeTruthy();
  });
});
