#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectName = process.argv[2];
if (!projectName) {
  console.error("❌ Please provide a project name, e.g. node script.js myapp");
  process.exit(1);
}

const projectPath = path.join(process.cwd(), projectName);
fs.mkdirSync(projectPath, { recursive: true });

console.log(`🚀 Creating project "${projectName}"...`);

const dirs = [
  "src/config",
  "src/middleware",
  "src/models",
  "src/routes",
  "src/utils",
];

dirs.forEach((dir) =>
  fs.mkdirSync(path.join(projectPath, dir), { recursive: true })
);

// ---------- package.json ----------
const pkg = {
  name: projectName,
  version: "1.0.0",
  type: "module",
  scripts: {
    dev: "nodemon src/server.js",
    start: "node src/server.js",
  },
  dependencies: {
    express: "^4.19.2",
    mongoose: "^8.5.0",
    dotenv: "^16.4.5",
    morgan: "^1.10.0",
    "express-rate-limit": "^7.2.0",
    "swagger-ui-express": "^5.0.1",
    winston: "^3.11.0",
    multer: "^1.4.5-lts.1",
    "@clerk/clerk-sdk-node": "^5.0.0",
  },
  devDependencies: {
    nodemon: "^3.1.0",
  },
};

fs.writeFileSync(
  path.join(projectPath, "package.json"),
  JSON.stringify(pkg, null, 2)
);

// ---------- .env ----------
const env = `
PORT=5000
MONGO_URI=mongodb://localhost:27017/${projectName}
CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key
`;
fs.writeFileSync(path.join(projectPath, ".env"), env.trim());

// ---------- src/config/db.js ----------
fs.writeFileSync(
  path.join(projectPath, "src/config/db.js"),
  `
import mongoose from "mongoose";
import { logger } from "../utils/logger.js";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    logger.info(\`MongoDB Connected: \${conn.connection.host}\`);
  } catch (error) {
    logger.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};
`
);

// ---------- src/utils/logger.js ----------
fs.writeFileSync(
  path.join(projectPath, "src/utils/logger.js"),
  `
import winston from "winston";

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => \`\${timestamp} [\${level.toUpperCase()}] \${message}\`)
  ),
  transports: [new winston.transports.Console()],
});
`
);

// ---------- src/utils/upload.js ----------
fs.writeFileSync(
  path.join(projectPath, "src/utils/upload.js"),
  `
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

export const upload = multer({ storage });
`
);

// ---------- src/middleware/clerkAuth.js ----------
fs.writeFileSync(
  path.join(projectPath, "src/middleware/clerkAuth.js"),
  `
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";

export const requireClerkAuth = ClerkExpressRequireAuth();
`
);

// ---------- src/middleware/errorHandler.js ----------
fs.writeFileSync(
  path.join(projectPath, "src/middleware/errorHandler.js"),
  `
export const errorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Server Error",
  });
};
`
);

// ---------- src/middleware/rateLimiter.js ----------
fs.writeFileSync(
  path.join(projectPath, "src/middleware/rateLimiter.js"),
  `
import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
`
);

// ---------- src/models/Address.js ----------
fs.writeFileSync(
  path.join(projectPath, "src/models/Address.js"),
  `
import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  postalCode: String,
  country: String,
});

export default AddressSchema;
`
);

// ---------- src/models/User.js ----------
fs.writeFileSync(
  path.join(projectPath, "src/models/User.js"),
  `
import mongoose from "mongoose";
import AddressSchema from "./Address.js";

const UserSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  profileImage: String,
  address: AddressSchema,
}, { timestamps: true });

export default mongoose.model("User", UserSchema);
`
);

// ---------- src/routes/user.js ----------
fs.writeFileSync(
  path.join(projectPath, "src/routes/user.js"),
  `
import express from "express";
import { requireClerkAuth } from "../middleware/clerkAuth.js";
import { users } from "@clerk/clerk-sdk-node";

const router = express.Router();

router.get("/me", requireClerkAuth, async (req, res) => {
  const clerkUser = await users.getUser(req.auth.userId);
  res.json({ message: "Welcome!", user: clerkUser });
});

export default router;
`
);

// ---------- src/routes/index.js ----------
fs.writeFileSync(
  path.join(projectPath, "src/routes/index.js"),
  `
import express from "express";
import userRoutes from "./user.js";

const router = express.Router();

router.use("/users", userRoutes);

export default router;
`
);

// ---------- src/app.js ----------
fs.writeFileSync(
  path.join(projectPath, "src/app.js"),
  `
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
`
);

// ---------- src/server.js ----------
fs.writeFileSync(
  path.join(projectPath, "src/server.js"),
  `
import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
connectDB();

app.listen(PORT, () => console.log(\`✅ Server running on port \${PORT}\`));
`
);

// ---------- swagger.json ----------
fs.writeFileSync(
  path.join(projectPath, "swagger.json"),
  JSON.stringify(
    {
      openapi: "3.0.0",
      info: { title: `${projectName} API`, version: "1.0.0" },
      paths: {
        "/api/users/me": {
          get: {
            summary: "Get current user (Clerk)",
            responses: { 200: { description: "User info" } },
          },
        },
      },
    },
    null,
    2
  )
);

// ---------- Installation ----------
console.log("📦 Installing dependencies...");
execSync("npm install", { stdio: "inherit", cwd: projectPath });

console.log(`
✅ Project "${projectName}" created successfully!

Next steps:
1. cd ${projectName}
2. Add your Clerk keys in .env
3. npm run dev
4. Visit Swagger docs at http://localhost:5000/api-docs
`);
