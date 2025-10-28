// backend/api/index.ts
import serverless from 'serverless-http';
import app from '../src/app';

// O quita esta línea por completo
export const config = { runtime: 'nodejs' };

export default serverless(app);
