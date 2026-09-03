import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { runAutoCompleteSweep } from "./lib/auto-complete";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Lazy sweep: keeps appointment statuses current without a cron job.
app.use("/api", (_req, _res, next) => {
  void runAutoCompleteSweep().finally(() => next());
});

app.use("/api", router);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const e = err as Error & { cause?: unknown };
  logger.error({ err, cause: e.cause }, "Unhandled error");
  res.status(500).json({ error: e.message, cause: String(e.cause ?? "") });
});

export default app;
