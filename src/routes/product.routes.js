import { Router } from "express";
import { listProducts, createProduct, updateProduct, deleteProduct, reorderProducts, trackProductClick } from "../controllers/product.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createProductSchema, updateProductSchema, reorderProductsSchema } from "../validators/product.validator.js";

const router = Router();

router.get("/", requireAuth, listProducts);
router.post("/", requireAuth, validate(createProductSchema), createProduct);
router.patch("/reorder", requireAuth, validate(reorderProductsSchema), reorderProducts);
router.post("/:id/click", trackProductClick);
router.patch("/:id", requireAuth, validate(updateProductSchema), updateProduct);
router.delete("/:id", requireAuth, deleteProduct);

export default router;
