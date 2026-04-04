import { Router } from "express";
import { registerController,loginController,getMe,refreshTokenController,logoutController,logoutAllController } from "../controllers/auth.controllers.js";
import app from "../app.js";
const appRouter = Router();



appRouter.post("/register",registerController)
appRouter.post("/login",loginController)
appRouter.get("/me",getMe)
appRouter.get("/refresh-token",refreshTokenController)
appRouter.post("/logout",logoutController)
appRouter.get("/logoutall",logoutAllController)

export default appRouter