import express from "express"
import multer from "multer";
import { authMiddleware, login, logout, signup } from "../controllers/authentication.js";
import { deleteTask, getTodo, updateTask } from "../controllers/todo.js";
import { getNewTask, postNewTask } from "../controllers/new-task.js";
const userRouter = express.Router()




userRouter.post("/signup",signup)
userRouter.post("/login",login)
userRouter.post("/logout",logout)

userRouter.get("/user/todo",authMiddleware, getTodo);

userRouter.get("/user/newtask",authMiddleware,getNewTask)
userRouter.post("/user/newtask", authMiddleware, postNewTask);


userRouter.put("/user/todo/:id", authMiddleware, updateTask);
userRouter.delete("/user/todo/:id", authMiddleware, deleteTask);


export default userRouter