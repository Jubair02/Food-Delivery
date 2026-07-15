import express from "express";
import { getMe, updateMe } from "../controllers/userController.js";
import { requireAuth } from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.get("/me", requireAuth, getMe);
userRouter.put("/me", requireAuth, updateMe);

export default userRouter;
