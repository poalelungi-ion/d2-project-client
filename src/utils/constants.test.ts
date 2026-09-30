import { describe, expect, it } from 'vitest';
import { UNIVERSITY_EMAIL_DOMAIN, isUniversityEmail } from './constants';

describe('isUniversityEmail', () => {
  it('accepts an address in the university domain', () => {
    expect(isUniversityEmail('a.musterfrau@uni-hildesheim.de')).toBe(true);
  });

  it('ignores case and surrounding whitespace, matching the backend', () => {
    expect(isUniversityEmail('  A.Musterfrau@Uni-Hildesheim.DE  ')).toBe(true);
  });

  it.each([
    ['a different provider', 'someone@gmail.com'],
    ['a different TLD', 'someone@uni-hildesheim.com'],
    // These two are why the check compares the domain part whole rather than
    // calling endsWith on the address.
    ['a domain that merely ends with ours', 'someone@notuni-hildesheim.de'],
    ['our domain used as a subdomain of someone else', 'someone@uni-hildesheim.de.attacker.example'],
    ['no domain at all', 'someone'],
    ['two @ signs', 'a@b@uni-hildesheim.de'],
  ])('rejects %s', (_label, email) => {
    expect(isUniversityEmail(email)).toBe(false);
  });

  it('is driven by the shared constant', () => {
    expect(isUniversityEmail(`x@${UNIVERSITY_EMAIL_DOMAIN}`)).toBe(true);
  });
});
