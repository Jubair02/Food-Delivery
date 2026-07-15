import express from "express";
import { listFood } from "../controllers/foodController.js";

const foodRouter = express.Router();

// Public — the storefront menu. Admin add/remove lives under /api/admin.
foodRouter.get("/list", listFood);

export default foodRouter;
