

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import userRouter from "./router/user_router.js";
import { DB } from "./db/connection.js";



const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();
const app = express();
app.use(cors()); 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: "10mb" })); 
app.use(express.static(path.join()));
app.use("/", userRouter);
DB()
const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1); 
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  process.exit(1);
});
 