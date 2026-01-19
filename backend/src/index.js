import express from "express";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";
import fileUpload from "express-fileupload";
import path from "path";
import cors from "cors";
import fs from "fs";
import { createServer } from "http";
import cron from "node-cron";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";

import { initializeSocket } from "./lib/socket.js";

import { connectDB } from "./lib/db.js";
import userRoutes from "./routes/user.route.js";
import adminRoutes from "./routes/admin.route.js";
import authRoutes from "./routes/auth.route.js";
import songRoutes from "./routes/song.route.js";
import albumRoutes from "./routes/album.route.js";
import statRoutes from "./routes/stat.route.js";

dotenv.config();

const __dirname = path.resolve();
const app = express();
const PORT = process.env.PORT;

const httpServer = createServer(app);
initializeSocket(httpServer);

// ========== SECURITY MIDDLEWARES ==========

// 1. Set security HTTP headers
app.use(helmet({
	crossOriginEmbedderPolicy: false,
	crossOriginResourcePolicy: { policy: "cross-origin" },
	contentSecurityPolicy: false // Disable for media streaming
}));

// 2. Rate limiting - prevent brute force & DDoS attacks
const limiter = rateLimit({
	max: 500, // 500 requests per IP
	windowMs: 15 * 60 * 1000, // per 15 minutes
	message: { error: 'Too many requests, please try again later.' },
	standardHeaders: true,
	legacyHeaders: false,
});
app.use('/api', limiter);

// 3. Stricter rate limit for auth routes
const authLimiter = rateLimit({
	max: 20, // 20 login attempts
	windowMs: 60 * 60 * 1000, // per hour
	message: { error: 'Too many auth attempts, try again in 1 hour.' }
});
app.use('/api/auth', authLimiter);

// 4. Body parser with size limit
app.use(express.json({ limit: '10kb' })); // Limit body size to prevent DoS

// 5. Data sanitization against NoSQL injection attacks
app.use(mongoSanitize());

// 6. Prevent HTTP Parameter Pollution attacks
app.use(hpp());

// CORS configuration
app.use(
	cors({
		origin: process.env.NODE_ENV === "production" 
			? ["https://musicflow-six.vercel.app", "https://musicflow.vercel.app"]
			: "http://localhost:3000",
		credentials: true,
	})
);

app.use(clerkMiddleware()); // this will add auth to req obj => req.auth
app.use(
	fileUpload({
		useTempFiles: true,
		tempFileDir: path.join(__dirname, "tmp"),
		createParentPath: true,
		limits: {
			fileSize: 10 * 1024 * 1024, // 10MB max file size
		},
	})
);

// cron jobs
const tempDir = path.join(process.cwd(), "tmp");
cron.schedule("0 * * * *", () => {
	if (fs.existsSync(tempDir)) {
		fs.readdir(tempDir, (err, files) => {
			if (err) {
				console.log("error", err);
				return;
			}
			for (const file of files) {
				fs.unlink(path.join(tempDir, file), (err) => {});
			}
		});
	}
});

app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/albums", albumRoutes);
app.use("/api/stats", statRoutes);

if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "../frontend/dist")));
	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "../frontend", "dist", "index.html"));
	});
}

// error handler
app.use((err, req, res, next) => {
	res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message });
});

httpServer.listen(PORT, () => {
	console.log("Server is running on port " + PORT);
	connectDB();
});
