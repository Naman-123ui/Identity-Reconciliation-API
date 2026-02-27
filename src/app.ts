import express, { Application, Request, Response, NextFunction } from "express";
import identifyRouter from "./routes/identify.route";

const app: Application = express();

// ─── Middleware ────────────────────────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger (simple)
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── Health check ──────────────────────────────────────────────────────────────

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "bitespeed-identity-reconciliation",
  });
});

// ─── Routes ────────────────────────────────────────────────────────────────────

app.use("/", identifyRouter);

// ─── 404 Handler ──────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// ─── Global error handler ─────────────────────────────────────────────────────

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[GlobalError]", err);
  res.status(500).json({ error: "Something went wrong" });
});

export default app;
