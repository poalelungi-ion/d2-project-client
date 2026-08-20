/**
 * @file stats.js
 * @description Dashboard KPI endpoint, mirroring the backend's routers/stats.py.
 */
import { get } from './client.js';

export const getStats = () => get('/stats/');
