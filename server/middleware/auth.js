import User from "../models/User.js";
import jwt from "jsonwebtoken";

//middleware to protect routes
export const protectRoute = async (req, res, next) => {
    try {
        let token = req.headers.token;

        // also accept Authorization: Bearer <token>
        if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({ success: false, message: "Token not provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // support tokens that use `userId` (from generateToken) or `id`
        const userId = decoded.id || decoded.userId;
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" });

        }

        req.user = user;
        next();

    } catch (error) {
        console.log(error.message);
        res.status(401).json({ success: false, message: error.message });

    }
}