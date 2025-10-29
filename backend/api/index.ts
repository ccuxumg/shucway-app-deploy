// backend/api/index.ts
import serverless from "serverless-http";
import app from "../src/app";

export const config = { api: { bodyParser: false } };

export default serverless(app, { basePath: "/api" });

