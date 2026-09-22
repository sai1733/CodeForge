const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/hashPassword');
const generateToken = require('../utils/generateToken');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Register a new user
 * Route: POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 'A user with this email address already exists', 400);
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create user (force role to 'intern')
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'intern',
    });

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    return successResponse(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
      'User registered successfully',
      210 // Using 201 Created or 200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Authenticate a user & get token
 * Route: POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    // Verify password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    // Verify account is active
    if (user.isActive === false) {
      return errorResponse(res, 'This account has been deactivated', 403);
    }

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    return successResponse(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
      'Logged in successfully'
    );
  } catch (error) {
    next(error);
  }
};

const crypto = require('crypto');
const PasswordReset = require('../models/PasswordReset');
const generateSecureToken = require('../utils/generateSecureToken');
const { sendEmail } = require('../config/mailer');

/**
 * Request password reset
 * Route: POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, 'Please provide an email address', 400);
    }

    const user = await User.findOne({ email });

    if (!user) {
      return errorResponse(res, 'This email is not registered', 404);
    }

    // Generate secure token
    const rawToken = generateSecureToken();
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Create PasswordReset record
    await PasswordReset.create({
      userId: user._id,
      token: tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    // Send reset email
    const env = require('../config/env');
    const resetLink = `${env.CLIENT_URL}/reset-password/${rawToken}`;
    const htmlContent = `
      <div style="background-color: #0b0f19; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #ffffff; text-align: center;">
        <!-- Logo -->
        <div style="margin-bottom: 25px; text-align: center;">
          <img src="cid:logo" alt="CodeForge Logo" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: none; display: block; margin: 0 auto;" />
        </div>

        <!-- Gradient Border Card Wrapper -->
        <div style="max-width: 540px; margin: 0 auto; background: linear-gradient(135deg, #00f0ff 0%, #d946ef 100%); padding: 2px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);">
          <!-- Inner Card -->
          <div style="background-color: #0d1322; border-radius: 10px; padding: 35px 25px; text-align: center;">
            
            <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0 0 5px 0; letter-spacing: 1px; text-transform: uppercase;">
              RESET PASSWORD
            </h1>
            
            <p style="color: #00f0ff; font-size: 13px; font-weight: 700; margin: 0 0 25px 0; letter-spacing: 1.5px;">
              SECURITY VERIFICATION
            </p>

            <p style="color: #b4c6ef; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; text-align: center;">
              You requested to reset your password for your CodeForge account. Click the button below to set up a new password:
            </p>

            <!-- Action Button -->
            <div style="margin: 25px 0;">
              <a href="${resetLink}" style="background: linear-gradient(135deg, #ef4444 0%, #3b82f6 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3); text-transform: uppercase; letter-spacing: 0.5px;">
                RESET PASSWORD
              </a>
            </div>

            <p style="color: #38bdf8; font-size: 12px; margin: 25px 0 0 0; font-weight: 500; letter-spacing: 0.5px; line-height: 1.4;">
              This link will expire in 1 hour. If you did not request this, you can safely ignore this email.
            </p>

            <!-- Fallback URL Section -->
            <div style="background-color: #090d16; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.05); padding: 15px; margin-top: 30px; text-align: left;">
              <p style="color: #64748b; font-size: 11px; margin: 0 0 8px 0; line-height: 1.4;">
                If the action button is not accessible, copy and paste this URL into your browser:
              </p>
              <a href="${resetLink}" style="color: #38bdf8; font-size: 11px; text-decoration: underline; word-break: break-all; font-family: monospace; display: block; line-height: 1.4;">
                ${resetLink}
              </a>
            </div>

          </div>
        </div>
      </div>
    `;

    await sendEmail(email, 'Reset your CodeForge password', htmlContent);

    return successResponse(
      res,
      null,
      'Password reset instructions have been sent to your email.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password
 * Route: POST /api/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return errorResponse(res, 'Token and password are required', 400);
    }

    if (password.length < 6) {
      return errorResponse(res, 'Password must be at least 6 characters', 400);
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid token
    const resetRecord = await PasswordReset.findOne({
      token: tokenHash,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!resetRecord) {
      return errorResponse(res, 'Invalid or expired password reset token', 400);
    }

    // Find User
    const user = await User.findById(resetRecord.userId);
    if (!user) {
      return errorResponse(res, 'User account associated with this token not found', 400);
    }

    // Update password
    const hashedPassword = await hashPassword(password);
    user.password = hashedPassword;
    await user.save();

    // Invalidate token
    resetRecord.used = true;
    await resetRecord.save();

    return successResponse(res, null, 'Password has been reset successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
};
