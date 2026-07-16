import express from "express";
import { adminLogin, adminMe, getCustomers, getOverview } from "../controllers/adminController.js";
import { addFood, updateFood, removeFood, listAllFood, setFoodDisabled } from "../controllers/foodController.js";
import { listOrders, updateStatus } from "../controllers/orderController.js";
import { listPromos, createPromo, togglePromo, deletePromo } from "../controllers/promoController.js";
import { requireAdminAuth } from "../middleware/adminAuth.js";
import { upload } from "../config/upload.js";

const adminRouter = express.Router();

// Public
adminRouter.post("/login", adminLogin);

// Everything below requires a valid admin JWT
adminRouter.use(requireAdminAuth);

adminRouter.get("/me", adminMe);
adminRouter.get("/overview", getOverview);
adminRouter.get("/customers", getCustomers);

adminRouter.get("/orders", listOrders);
adminRouter.post("/orders/status", updateStatus);

adminRouter.get("/food", listAllFood);
adminRouter.post("/food", upload.single("image"), addFood);
adminRouter.post("/food/edit", upload.single("image"), updateFood);
adminRouter.post("/food/toggle", setFoodDisabled);
adminRouter.post("/food/remove", removeFood);

adminRouter.get("/promos", listPromos);
adminRouter.post("/promos", createPromo);
adminRouter.post("/promos/toggle", togglePromo);
adminRouter.post("/promos/remove", deletePromo);

export default adminRouter;
