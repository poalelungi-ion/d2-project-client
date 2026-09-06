import { get } from './client';

export const getStats = (): Promise<Response> => get('/stats/');
