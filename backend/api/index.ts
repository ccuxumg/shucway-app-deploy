// backend/api/index.ts
import serverless from 'serverless-http';
import app from '../src/app';

// (opcional) fijar runtime
export const config = { runtime: 'nodejs20.x' };

export default serverless(app);
