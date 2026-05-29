import { Request, Response } from 'express';
import User from '../models/User';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import logger from '../utils/logger';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const setTokenCookie = (res: Response, token: string) => {
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
export const authUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  try {
    const user: any = await User.findOne({ email });

    if (user) {
      let isMatch = false;
      const isBcrypt = user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$');

      if (isBcrypt) {
        isMatch = await user.matchPassword(password);
      } else {
        isMatch = user.password === password;
        if (isMatch) {
          // Automatic migration: hash and save plaintext password directly to DB
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);
          await User.updateOne({ _id: user._id }, { $set: { password: hashedPassword } });
          user.password = hashedPassword;
        }
      }

      if (isMatch) {
        if (!user.active) {
          return res.status(401).json({ message: 'Tài khoản của bạn đã bị khóa' });
        }

        const refreshToken = generateRefreshToken(user._id.toString());
        setTokenCookie(res, refreshToken);

        // Save to express-session
        (req.session as any).userId = user._id.toString();
        (req.session as any).role = user.role;

        return res.json({
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
          active: user.active,
          addresses: user.addresses,
          token: generateAccessToken(user._id.toString()),
        });
      } else {
        return res.status(401).json({ message: 'Email hoặc mật khẩu không hợp lệ' });
      }
    } else {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không hợp lệ' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'Tài khoản đã tồn tại' });
    }

    const user: any = await User.create({
      name,
      email,
      password,
      phone,
    });

    if (user) {
      const refreshToken = generateRefreshToken(user._id.toString());
      setTokenCookie(res, refreshToken);

      // Save to express-session
      (req.session as any).userId = user._id.toString();
      (req.session as any).role = user.role;

      res.status(201).json({
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        active: user.active,
        addresses: user.addresses,
        token: generateAccessToken(user._id.toString()),
      });
    } else {
      res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshUser = async (req: Request, res: Response) => {
  const token = req.cookies.jwt;

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
    const user: any = await User.findById(decoded.id).select('-password');

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
      token: generateAccessToken(user._id.toString()),
    });
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logoutUser = async (req: Request, res: Response) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  
  req.session.destroy((err) => {
    if (err) console.error('Error destroying session:', err);
    res.status(200).json({ message: 'Logged out successfully' });
  });
};

// @desc    Redirect to Google OAuth consent page (without trailing slash callback)
// @route   GET /api/auth/google
// @access  Public
export const googleLogin = (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL;
  const targetUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    callbackUrl || ''
  )}&response_type=code&scope=${encodeURIComponent('profile email')}&prompt=select_account`;
  
  res.redirect(targetUrl);
};

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
export const googleCallback = async (req: Request, res: Response) => {
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
        code: code as string,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: process.env.GOOGLE_CALLBACK_URL || '',
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json() as any;

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

    const profileData = await profileResponse.json() as any;

    if (!profileResponse.ok || !profileData.email) {
      console.error('Error retrieving profile info:', profileData);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/?error=profile_retrieval_failed`);
    }

    const { email, name, picture } = profileData;

    // 3. Find or create user
    let user: any = await User.findOne({ email });

    if (!user) {
      // Create user with a secure random password, empty phone, and is_profile_incomplete: true
      const randomPassword = crypto.randomBytes(16).toString('hex');
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        password: randomPassword,
        phone: '',
        avatar: picture || '',
        role: 'customer',
        active: true,
        is_profile_incomplete: true,
      });
    }

    if (!user.active) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/?error=account_blocked`);
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Check if user profile is incomplete
    if (user.is_profile_incomplete || !user.phone || user.phone === '0000000000') {
      const tempToken = jwt.sign(
        { id: user._id.toString(), isProfileIncomplete: true },
        process.env.JWT_SECRET!,
        { expiresIn: '10m' }
      );

      return res.redirect(
        `${frontendUrl}/login-success?tempToken=${encodeURIComponent(tempToken)}&isProfileIncomplete=true`
      );
    }

    // 4. Save session and tokens
    const refreshToken = generateRefreshToken(user._id.toString());
    setTokenCookie(res, refreshToken);

    // Save to express-session
    (req.session as any).userId = user._id.toString();
    (req.session as any).role = user.role;
    
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

    const token = generateAccessToken(user._id.toString());

    // Redirect to frontend callback route with token and user data
    res.redirect(
      `${frontendUrl}/login-success?token=${encodeURIComponent(token)}&user=${encodeURIComponent(
        JSON.stringify(userData)
      )}`
    );
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/?error=server_error`);
  }
};

// @desc    Register a new user via Google Sign-In SDK
// @route   POST /api/auth/google-register
// @access  Public
export const googleRegister = async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Không tìm thấy Google Token!' });
  }

  let email = '';
  let name = '';
  let picture = '';

  try {
    // Verify Google ID Token using official googleClient library
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'Google Token không hợp lệ hoặc thiếu thông tin email!' });
    }
    email = payload.email;
    name = payload.name || '';
    picture = payload.picture || '';
  } catch (error: any) {
    logger.error(`Google token verification failed: ${error.message}`);
    return res.status(400).json({ message: 'Xác thực tài khoản Google thất bại hoặc token đã hết hạn.' });
  }

  try {
    // Check if user exists in database
    let user: any = await User.findOne({ email });

    if (user) {
      if (!user.active) {
        return res.status(401).json({ message: 'Tài khoản của bạn đã bị khóa' });
      }

      // If user profile is incomplete (is_profile_incomplete is true OR phone is missing/empty/dummy '0000000000')
      if (user.is_profile_incomplete || !user.phone || user.phone === '0000000000') {
        // Generate temporary token containing isProfileIncomplete: true (expires in 10 minutes)
        const tempToken = jwt.sign(
          { id: user._id.toString(), isProfileIncomplete: true },
          process.env.JWT_SECRET!,
          { expiresIn: '10m' }
        );

        return res.json({
          success: true,
          exists: true,
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

      // User exists and profile is complete! Return exists: true, log them in automatically
      const refreshToken = generateRefreshToken(user._id.toString());
      setTokenCookie(res, refreshToken);

      // Save to express-session
      (req.session as any).userId = user._id.toString();
      (req.session as any).role = user.role;

      const accessToken = generateAccessToken(user._id.toString());
      
      return res.json({
        success: true,
        exists: true,
        isProfileIncomplete: false,
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
    const randomPassword = crypto.randomBytes(16).toString('hex');
    user = await User.create({
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
    const tempToken = jwt.sign(
      { id: user._id.toString(), isProfileIncomplete: true },
      process.env.JWT_SECRET!,
      { expiresIn: '10m' }
    );

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

  } catch (error: any) {
    logger.error(`Google register error: ${error.message || error}`);
    return res.status(500).json({ message: 'Lỗi máy chủ khi xử lý Google token' });
  }
};

// @desc    Update phone number for incomplete profile
// @route   PUT /api/auth/update-phone
// @access  Public (needs temporary JWT token)
export const updatePhone = async (req: Request, res: Response) => {
  const { phone, password } = req.body;
  const authHeader = req.headers.authorization;

  if (!phone) {
    return res.status(400).json({ message: 'Vui lòng nhập số điện thoại!' });
  }

  if (!password) {
    return res.status(400).json({ message: 'Vui lòng đặt mật khẩu tài khoản!' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự!' });
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Mã xác thực không hợp lệ!' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    
    if (!decoded || !decoded.id || !decoded.isProfileIncomplete) {
      return res.status(401).json({ message: 'Phiên làm việc tạm thời không hợp lệ!' });
    }

    const user: any = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản!' });
    }

    // Update phone number, password and complete profile
    user.phone = phone;
    user.password = password;
    user.is_profile_incomplete = false;
    await user.save();

    // Create official login session
    const refreshToken = generateRefreshToken(user._id.toString());
    setTokenCookie(res, refreshToken);

    // Save to express-session
    (req.session as any).userId = user._id.toString();
    (req.session as any).role = user.role;

    const accessToken = generateAccessToken(user._id.toString());

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

  } catch (error) {
    console.error('Update phone error:', error);
    return res.status(401).json({ message: 'Mã xác thực đã hết hạn hoặc không hợp lệ!' });
  }
};
