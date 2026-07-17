import express from "express";
import { getMe, updateMe, updateAvatar } from "../controllers/userController.js";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../config/upload.js";

const userRouter = express.Router();

userRouter.get("/me", requireAuth, getMe);
userRouter.put("/me", requireAuth, updateMe);
userRouter.post("/avatar", requireAuth, upload.single("image"), updateAvatar);

export default userRouter;
