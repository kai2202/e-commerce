"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.staffOrAdmin = exports.admin = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'supersecretkey');
            req.user = await User_1.default.findById(decoded.id).select('-password');
            return next();
        }
        catch (error) {
            console.error(error);
        }
    }
    // Fallback to express-session
    const session = req.session;
    if (session && session.userId) {
        try {
            req.user = await User_1.default.findById(session.userId).select('-password');
            if (req.user)
                return next();
        }
        catch (error) {
            console.error(error);
        }
    }
    res.status(401).json({ message: 'Not authorized, no token or session' });
};
exports.protect = protect;
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    }
    else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};
exports.admin = admin;
const staffOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'staff_inventory')) {
        next();
    }
    else {
        res.status(403).json({ message: 'Not authorized as staff or admin' });
    }
};
exports.staffOrAdmin = staffOrAdmin;
