"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePhone = exports.googleRegister = exports.googleCallback = exports.googleLogin = exports.logoutUser = exports.refreshUser = exports.getUsers = exports.registerUser = exports.authUser = void 0;
const User_1 = __importDefault(require("../models/User"));
const generateToken_1 = require("../utils/generateToken");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const setTokenCookie = (res, token) => {
    res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
        sameSite: 'lax',
        maxAge: 5 * 60 * 1000, // 5 minutes
    });
};
// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User_1.default.findOne({ email });
        if (user && user.password === password) {
            if (!user.active) {
                return res.status(401).json({ message: 'Tài khoản của bạn đã bị khóa' });
            }
            const refreshToken = (0, generateToken_1.generateRefreshToken)(user._id.toString());
            setTokenCookie(res, refreshToken);
            // Save to express-session
            req.session.userId = user._id.toString();
            req.session.role = user.role;
            res.json({
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                avatar: user.avatar,
                active: user.active,
                addresses: user.addresses,
                token: (0, generateToken_1.generateAccessToken)(user._id.toString()),
            });
        }
        else {
            res.status(401).json({ message: 'Email hoặc mật khẩu không hợp lệ' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.authUser = authUser;
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password, phone } = req.body;
    try {
        const userExists = await User_1.default.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Tài khoản đã tồn tại' });
        }
        const user = await User_1.default.create({
            name,
            email,
            password,
            phone,
        });
        if (user) {
            const refreshToken = (0, generateToken_1.generateRefreshToken)(user._id.toString());
            setTokenCookie(res, refreshToken);
            // Save to express-session
            req.session.userId = user._id.toString();
            req.session.role = user.role;
            res.status(201).json({
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                avatar: user.avatar,
                active: user.active,
                addresses: user.addresses,
                token: (0, generateToken_1.generateAccessToken)(user._id.toString()),
            });
        }
        else {
            res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.registerUser = registerUser;
// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const users = await User_1.default.find({});
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getUsers = getUsers;
// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
const refreshUser = async (req, res) => {
    const token = req.cookies.jwt;
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET || 'superrefreshsecret');
        const user = await User_1.default.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        if (!user.active) {
            return res.status(401).json({ message: 'Tài khoản của bạn đã bị khóa' });
        }
        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            avatar: user.avatar,
            active: user.active,
            addresses: user.addresses,
            token: (0, generateToken_1.generateAccessToken)(user._id.toString()),
        });
    }
    catch (error) {
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};
exports.refreshUser = refreshUser;
// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = async (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0)
    });
    req.session.destroy((err) => {
        if (err)
            console.error('Error destroying session:', err);
        res.status(200).json({ message: 'Logged out successfully' });
    });
};
exports.logoutUser = logoutUser;
// @desc    Redirect to Google OAuth consent page (without trailing slash callback)
// @route   GET /api/auth/google
// @access  Public
const googleLogin = (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL;
    const targetUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl || '')}&response_type=code&scope=${encodeURIComponent('profile email')}&prompt=select_account`;
    res.redirect(targetUrl);
};
exports.googleLogin = googleLogin;
// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
const googleCallback = async (req, res) => {
    const { code } = req.query;
    if (!code) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/?error=no_code`);
    }
    try {
        // 1. Exchange authorization code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code: code,
                client_id: process.env.GOOGLE_CLIENT_ID || '',
                client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
                redirect_uri: process.env.GOOGLE_CALLBACK_URL || '',
                grant_type: 'authorization_code',
            }),
        });
        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok || !tokenData.access_token) {
            console.error('Error exchanging code for tokens:', tokenData);
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/?error=token_exchange_failed`);
        }
        // 2. Retrieve user profile info from Google
        const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });
        const profileData = await profileResponse.json();
        if (!profileResponse.ok || !profileData.email) {
            console.error('Error retrieving profile info:', profileData);
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/?error=profile_retrieval_failed`);
        }
        const { email, name, picture } = profileData;
        // 3. Find or create user
        let user = await User_1.default.findOne({ email });
        if (!user) {
            // Create user with a secure random password and dummy phone
            const randomPassword = crypto_1.default.randomBytes(16).toString('hex');
            user = await User_1.default.create({
                name: name || email.split('@')[0],
                email,
                password: randomPassword,
                phone: '0000000000',
                avatar: picture || '',
                role: 'customer',
                active: true,
            });
        }
        if (!user.active) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/?error=account_blocked`);
        }
        // 4. Save session and tokens
        const refreshToken = (0, generateToken_1.generateRefreshToken)(user._id.toString());
        setTokenCookie(res, refreshToken);
        // Save to express-session
        req.session.userId = user._id.toString();
        req.session.role = user.role;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        // Prepare user data to pass to frontend
        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            avatar: user.avatar,
            active: user.active,
            addresses: user.addresses,
        };
        const token = (0, generateToken_1.generateAccessToken)(user._id.toString());
        // Redirect to frontend callback route with token and user data
        res.redirect(`${frontendUrl}/login-success?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(userData))}`);
    }
    catch (error) {
        console.error('Google OAuth callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/?error=server_error`);
    }
};
exports.googleCallback = googleCallback;
// @desc    Register a new user via Google Sign-In SDK
// @route   POST /api/auth/google-register
// @access  Public
const googleRegister = async (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ message: 'Không tìm thấy Google Token!' });
    }
    try {
        // Decode Google ID Token without library (payload is base64Url encoded)
        const base64Url = token.split('.')[1];
        if (!base64Url) {
            return res.status(400).json({ message: 'Google Token không hợp lệ!' });
        }
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(Buffer.from(base64, 'base64')
            .toString('utf-8')
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join(''));
        const googleProfile = JSON.parse(jsonPayload);
        if (!googleProfile || !googleProfile.email) {
            return res.status(400).json({ message: 'Google Token không chứa thông tin email!' });
        }
        const { email, name, picture } = googleProfile;
        // Check if user exists in database
        let user = await User_1.default.findOne({ email });
        if (user) {
            // User already exists! Return exists: true, log them in automatically
            if (!user.active) {
                return res.status(401).json({ message: 'Tài khoản của bạn đã bị khóa' });
            }
            const refreshToken = (0, generateToken_1.generateRefreshToken)(user._id.toString());
            setTokenCookie(res, refreshToken);
            // Save to express-session
            req.session.userId = user._id.toString();
            req.session.role = user.role;
            const accessToken = (0, generateToken_1.generateAccessToken)(user._id.toString());
            return res.json({
                success: true,
                exists: true,
                isProfileIncomplete: user.is_profile_incomplete || false,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    avatar: user.avatar,
                    active: user.active,
                    addresses: user.addresses,
                },
                token: accessToken,
            });
        }
        // User does not exist! Create a new user with empty phone and is_profile_incomplete: true
        const randomPassword = crypto_1.default.randomBytes(16).toString('hex');
        user = await User_1.default.create({
            name: name || email.split('@')[0],
            email,
            password: randomPassword,
            phone: '', // empty phone
            avatar: picture || '',
            role: 'customer',
            active: true,
            is_profile_incomplete: true,
        });
        // Generate temporary token containing isProfileIncomplete: true (expires in 10 minutes)
        const tempToken = jsonwebtoken_1.default.sign({ id: user._id.toString(), isProfileIncomplete: true }, process.env.JWT_SECRET || 'supersecretkey', { expiresIn: '10m' });
        return res.status(201).json({
            success: true,
            exists: false,
            isProfileIncomplete: true,
            token: tempToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                avatar: user.avatar,
                active: user.active,
                addresses: user.addresses,
            }
        });
    }
    catch (error) {
        console.error('Google register error:', error);
        return res.status(500).json({ message: 'Lỗi máy chủ khi xử lý Google token' });
    }
};
exports.googleRegister = googleRegister;
// @desc    Update phone number for incomplete profile
// @route   PUT /api/auth/update-phone
// @access  Public (needs temporary JWT token)
const updatePhone = async (req, res) => {
    const { phone } = req.body;
    const authHeader = req.headers.authorization;
    if (!phone) {
        return res.status(400).json({ message: 'Vui lòng nhập số điện thoại!' });
    }
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Mã xác thực không hợp lệ!' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'supersecretkey');
        if (!decoded || !decoded.id || !decoded.isProfileIncomplete) {
            return res.status(401).json({ message: 'Phiên làm việc tạm thời không hợp lệ!' });
        }
        const user = await User_1.default.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản!' });
        }
        // Update phone number and complete profile
        user.phone = phone;
        user.is_profile_incomplete = false;
        await user.save();
        // Create official login session
        const refreshToken = (0, generateToken_1.generateRefreshToken)(user._id.toString());
        setTokenCookie(res, refreshToken);
        // Save to express-session
        req.session.userId = user._id.toString();
        req.session.role = user.role;
        const accessToken = (0, generateToken_1.generateAccessToken)(user._id.toString());
        return res.json({
            success: true,
            message: 'Cập nhật số điện thoại thành công!',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                avatar: user.avatar,
                active: user.active,
                addresses: user.addresses,
            },
            token: accessToken
        });
    }
    catch (error) {
        console.error('Update phone error:', error);
        return res.status(401).json({ message: 'Mã xác thực đã hết hạn hoặc không hợp lệ!' });
    }
};
exports.updatePhone = updatePhone;
