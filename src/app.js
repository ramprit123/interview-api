import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";
import routes from "./routes/index.js";
import swaggerDoc from "../swagger.json" assert { type: "json" };

dotenv.config();

const app = express();
app.use(express.json());
app.use(morgan("dev"));
app.use("/api", apiLimiter);
app.use("/api", routes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));
app.use(errorHandler);

export default app;
