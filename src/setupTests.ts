import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { resetStores } from './stores/reset';

afterEach(resetStores);
