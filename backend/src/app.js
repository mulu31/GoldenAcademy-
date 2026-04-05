import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import routes from "./routes/index.js";
import { env } from "./config/env.js";
import { loggerMiddleware } from "./middlewares/logger.middleware.js";
import { errorHandler, notFound } from "./middlewares/error.middleware.js";

const app = express();

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (env.corsOrigins.includes("*") || env.corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.disable("x-powered-by");
app.use(helmet());
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(loggerMiddleware);

app.get("/api/health", (_req, res) => {
  return res
    .status(200)
    .json({ success: true, message: "Healthy", data: { env: env.nodeEnv } });
});

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
