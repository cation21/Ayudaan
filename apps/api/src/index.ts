import "./env.js";
import cors from "cors";
import express from "express";
import path from "node:path";
import { rootRouter } from "./routes/index.js";

const app = express();
app.use(cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());
// LocalDiskStorage (spec section 8) writes here; served as-is for local
// dev. A real deployment serves proof documents from S3/R2 directly and
// this line goes away.
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));
app.use(rootRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  console.log(`Ayudaan API listening on :${port}`);
});
