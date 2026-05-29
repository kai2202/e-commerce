"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.post('/register', authController_1.registerUser);
router.post('/login', authController_1.authUser);
router.post('/refresh', authController_1.refreshUser);
router.post('/logout', authController_1.logoutUser);
router.get('/users', authMiddleware_1.protect, authMiddleware_1.admin, authController_1.getUsers);
router.get('/google', authController_1.googleLogin);
router.get('/google/callback', authController_1.googleCallback);
router.post('/google-register', authController_1.googleRegister);
router.put('/update-phone', authController_1.updatePhone);
exports.default = router;
