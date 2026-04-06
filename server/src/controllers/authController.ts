import { User } from '../models/User';
import { hashPassword, comparePassword, generateUsername, generateToken } from '../utils';
import type { AppRequest as Request, AppResponse as Response, NextFunction } from '../types/http';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400);
      throw new Error('Email already registered');
    }

    // Generate unique username from name
    const username = await generateUsername(name);

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      username,
      password: hashedPassword,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        userId: user._id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    next(error as Error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    // Compare password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    // Generate JWT
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
    });

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          hasCloudflareCredentials: !!(user.cloudflareAccountId && user.cloudflareApiToken),
        },
      },
    });
  } catch (error) {
    next(error as Error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.clearCookie('token');
    res.json({
      success: true,
      message: 'Logout successful',
      data: null,
    });
  } catch (error) {
    next(error as Error);
  }
};

export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401);
      throw new Error('Not authenticated');
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    res.json({
      success: true,
      message: 'User retrieved successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          hasCloudflareCredentials: !!(user.cloudflareAccountId && user.cloudflareApiToken),
        },
      },
    });
  } catch (error) {
    next(error as Error);
  }
};
