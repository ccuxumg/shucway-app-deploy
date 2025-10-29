// backend/api/index.ts
import serverless from "serverless-http";
import app from "../src/app";

// Para uploads grandes, ya llevas tus parsers en app.ts,
// así que desactiva el bodyParser de Vercel:
export const config = {
  api: { bodyParser: false }
};

export default serverless(app);
