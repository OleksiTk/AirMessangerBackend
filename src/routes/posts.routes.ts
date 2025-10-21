// // src/routes/posts.routes.ts
// import express from "express";
// import { postController } from "../controllers/postController";
// import { authMiddleware } from "../middlewares/authMiddleware";

// const router = express.Router();

// // Публічні маршрути
// router.get("/", postController.getAllPosts);
// router.get("/:id", postController.getPostById);

// // Приватні маршрути
// router.post("/", authMiddleware, postController.createPost);
// router.put("/:id", authMiddleware, postController.updatePost);
// router.delete("/:id", authMiddleware, postController.deletePost);

// export default router;
