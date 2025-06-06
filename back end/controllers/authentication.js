import bcrypt from 'bcrypt';
import userModel from '../models/user_model.js';
import jwt from "jsonwebtoken"



const { verify, sign } = jwt;

export const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields are required." });
        }

        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword
        });

        await newUser.save();

        res.status(201).json({ message: "successfully registered" });

    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};




export const login = async (req, res) => {
    console.log("Login Request Body:", req.body);

    try {
        const { email, password } = req.body;

      
        if (!email?.trim() || !password?.trim()) {
            return res.status(400).json({ error: "Email and password are required" });
        }


        const user = await userModel.findOne({ email: email.trim() });
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

       
        const passwordMatch = await bcrypt.compare(password.trim(), user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const secretKey = process.env.JWT_SECRET || 'default_secret_key';
        if (!secretKey) {
            return res.status(500).json({ error: "JWT secret key is missing" });
        }

      
        const userPayload = {
            id: user._id,  
            name: user.name,
            email: user.email,
        };

        const token = jwt.sign(userPayload, secretKey, { expiresIn: '7d' });

        const data = {
            token,
            name: user.name,
            email: user.email,
            message: "Login successful",

        };

        return res.status(200).json(data);

    } catch (error) {
        console.error("Login Error:", error);

        return res.status(500).json({ 
            error: "Internal Server Error", 
            details: error.message 
        });
    }
};




export const authMiddleware = (req, res, next) => {
    
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    if (blacklistedTokens.has(token)) {
        return res.status(401).json({ error: "Token has been invalidated. Please log in again." });
    }

    try {
        const secretKey = process.env.JWT_SECRET || "default_secret_key";
        const decoded = jwt.verify(token, secretKey);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }
};




const blacklistedTokens = new Set(); 

export const logout= async (req, res) => {
 
    try {
        const token = req.header("Authorization")?.split(" ")[1];
        if (!token) {
            return res.status(400).json({ error: "Token required" });
        }

        blacklistedTokens.add(token); 
        return res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        console.error("Logout Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
