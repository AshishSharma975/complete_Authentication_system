import express from "express"
import connectTODB from "./config/database.js"
import config from "./config/config.js"
import appRouter from "./routes/auth.routes.js"
import cookieParser from "cookie-parser"
const app = express();

app.use(express.json())
app.use(cookieParser())
app.use("/api/auth",appRouter)


connectTODB();

export default app;