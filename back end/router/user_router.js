import express from "express"
import multer from "multer";
import { authMiddleware, login, logout, signup } from "../controllers/authentication.js";
import { getTodo } from "../controllers/todo.js";
import { getNewTask } from "../controllers/new-task.js";
const userRouter = express.Router()




userRouter.post("/signup",signup)
userRouter.post("/login",login)
userRouter.post("/logout",logout)

userRouter.get("/user/todo",authMiddleware, getTodo);

userRouter.get("/user/newtask",authMiddleware,getNewTask)

export default userRouter     