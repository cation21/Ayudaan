import "dotenv/config";
import express from "express";
import { rootRouter } from "./routes/index.js";

const app = express();
app.use(express.json());
app.use(rootRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  console.log(`Ayudaan API listening on :${port}`);
});
