import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { clerkAuth } from "./middleware/clerkAuth.js";
import routes from "./routes/index.js";
import swaggerDoc from "../swagger.json" assert { type: "json" };

dotenv.config();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(morgan("dev"));

// Initialize Clerk middleware
app.use(clerkAuth);

// Root health check (no rate limiting)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Interview API'
  });
});

app.use("/api", apiLimiter);
app.use("/api", routes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));
app.use(errorHandler);

export default app;
