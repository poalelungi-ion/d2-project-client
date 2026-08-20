/**
 * @file stats.ts
 * @description Dashboard KPI endpoint, mirroring the backend's routers/stats.py.
 */
import { get } from './client';

export const getStats = (): Promise<Response> => get('/stats/');
