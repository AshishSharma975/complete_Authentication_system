import { Router } from "express";
import { registerController,loginController,getMe,refreshTokenController } from "../controllers/auth.controllers.js";
const appRouter = Router();



appRouter.post("/register",registerController)
appRouter.post("/login",loginController)
appRouter.get("/me",getMe)
appRouter.get("/refresh-token",refreshTokenController)

export default appRouter