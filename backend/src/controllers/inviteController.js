const crypto = require('crypto');
const Invite = require('../models/Invite');
const User = require('../models/User');
const Project = require('../models/Project');
const generateSecureToken = require('../utils/generateSecureToken');
const { sendEmail } = require('../config/mailer');
const { hashPassword } = require('../utils/hashPassword');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Helper to hash a token
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Create invite (Manager/SuperAdmin only)
 * Route: POST /api/invites
 */
const createInvite = async (req, res, next) => {
  try {
    const { email, projectId, role } = req.body;

    if (!email) {
      return errorResponse(res, 'Please provide an email address', 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 'A user with this email address already exists', 400);
    }

    // Generate token
    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);

    // Create Invite
    const invite = await Invite.create({
      email,
      token: tokenHash,
      invitedBy: req.user._id,
      projectId: projectId || undefined,
      role: role || 'intern',
    });

    // Send email
    const env = require('../config/env');
    const signupLink = `${env.CLIENT_URL}/accept-invite/${rawToken}`;
    const roleUpper = invite.role.toUpperCase();
    const roleCapitalized = invite.role.charAt(0).toUpperCase() + invite.role.slice(1);
    const htmlContent = `
      <div style="background-color: #0b0f19; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #ffffff; text-align: center;">
        <!-- Logo -->
        <div style="margin-bottom: 25px; text-align: center;">
          <img src="cid:logo" alt="CodeForge Logo" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: none; display: block; margin: 0 auto;" />
        </div>

        <!-- Gradient Border Card Wrapper -->
        <div style="max-width: 540px; margin: 0 auto; background: linear-gradient(135deg, #d946ef 0%, #06b6d4 100%); padding: 2px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);">
          <!-- Inner Card -->
          <div style="background-color: #0d1322; border-radius: 10px; padding: 35px 25px; text-align: center;">
            
            <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0 0 5px 0; letter-spacing: 1px; text-transform: uppercase;">
              WELCOME TO CODEFORGE
            </h1>
            
            <p style="color: #d946ef; font-size: 13px; font-weight: 700; margin: 0 0 25px 0; letter-spacing: 1.5px;">
              ${roleUpper} ACCESS INITIALIZATION
            </p>

            <p style="color: #b4c6ef; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; text-align: center;">
              You have been officially invited to join CodeForge as a <strong style="color: #00f0ff; background-color: rgba(0, 240, 255, 0.1); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(0, 240, 255, 0.2); font-family: monospace; font-size: 13px; font-weight: bold; white-space: nowrap; display: inline-block;">${roleCapitalized}</strong>. Complete your registration and configure your credentials.
            </p>

            <p style="color: #ffffff; font-size: 14px; margin: 0 0 25px 0; font-weight: 600;">
              Initialize your session and security profile below:
            </p>

            <!-- Action Button -->
            <div style="margin: 25px 0;">
              <a href="${signupLink}" style="background: linear-gradient(135deg, #d946ef 0%, #2563eb 50%, #06b6d4 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3); text-transform: uppercase; letter-spacing: 0.5px;">
                SET UP ACCOUNT & AUTHENTICATE
              </a>
            </div>

            <p style="color: #7dd3fc; font-size: 12px; margin: 25px 0 0 0; font-weight: 500; letter-spacing: 0.5px;">
              Invite link expires in 48 hours.
            </p>

            <!-- Fallback URL Section -->
            <div style="background-color: #090d16; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.05); padding: 15px; margin-top: 30px; text-align: left;">
              <p style="color: #64748b; font-size: 11px; margin: 0 0 8px 0; line-height: 1.4;">
                If the action button is not accessible, copy and paste this URL into your browser:
              </p>
              <a href="${signupLink}" style="color: #00f0ff; font-size: 11px; text-decoration: underline; word-break: break-all; font-family: monospace; display: block; line-height: 1.4;">
                ${signupLink}
              </a>
            </div>

          </div>
        </div>
      </div>
    `;

    await sendEmail(email, 'Invite to join CodeForge Portal', htmlContent);

    return successResponse(res, { inviteId: invite._id }, 'Invitation sent successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Verify invite (Public)
 * Route: GET /api/invites/verify/:token
 */
const verifyInvite = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return errorResponse(res, 'Token is required', 400);
    }

    const tokenHash = hashToken(token);
    const invite = await Invite.findOne({ token: tokenHash });

    if (!invite) {
      return errorResponse(res, 'Invalid invitation token', 400);
    }

    if (invite.used) {
      return errorResponse(res, 'This invitation has already been used', 400);
    }

    if (invite.expiresAt < new Date()) {
      return errorResponse(res, 'This invitation has expired', 400);
    }

    return successResponse(res, {
      email: invite.email,
      role: invite.role,
      projectId: invite.projectId,
    }, 'Invitation is valid');
  } catch (error) {
    next(error);
  }
};

/**
 * Complete registration (Public)
 * Route: POST /api/invites/complete
 */
const completeInvite = async (req, res, next) => {
  try {
    const { token, name, password } = req.body;

    if (!token || !name || !password) {
      return errorResponse(res, 'Please provide token, name and password', 400);
    }

    if (password.length < 6) {
      return errorResponse(res, 'Password must be at least 6 characters', 400);
    }

    const tokenHash = hashToken(token);
    const invite = await Invite.findOne({ token: tokenHash });

    if (!invite) {
      return errorResponse(res, 'Invalid invitation token', 400);
    }

    if (invite.used) {
      return errorResponse(res, 'This invitation has already been used', 400);
    }

    if (invite.expiresAt < new Date()) {
      return errorResponse(res, 'This invitation has expired', 400);
    }

    // Check if email already registered (redundancy check)
    const existingUser = await User.findOne({ email: invite.email });
    if (existingUser) {
      return errorResponse(res, 'An account with this email address has already been registered', 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create User
    const user = await User.create({
      name,
      email: invite.email,
      password: hashedPassword,
      role: invite.role,
      isActive: true,
    });

    // Mark invite as used
    invite.used = true;
    await invite.save();

    // If projectId was set, add the user's ID to that Project's internIds array
    if (invite.projectId && invite.role === 'intern') {
      await Project.findByIdAndUpdate(invite.projectId, {
        $addToSet: { internIds: user._id },
      });
    }

    // Trigger notification to the user who invited them
    try {
      const Notification = require('../models/Notification');
      const invitingUser = await User.findById(invite.invitedBy);
      
      if (invitingUser) {
        const notification = await Notification.create({
          recipient: invitingUser._id,
          type: 'project',
          title: 'New User Registered',
          message: `${user.name} has completed registration as an ${user.role} via invitation.`,
          data: { userId: user._id.toString() }
        });

        const { emitToUser } = require('../config/socket');
        emitToUser(invitingUser._id.toString(), 'user:registered', {
          id: notification._id,
          type: 'project',
          title: notification.title,
          message: notification.message,
          timestamp: notification.createdAt,
          read: notification.read,
          userId: user._id,
        });
      }
    } catch (notifErr) {
      console.error('Failed to trigger admin registration notification:', notifErr);
    }

    return successResponse(res, {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    }, 'Account registered successfully through invitation', 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInvite,
  verifyInvite,
  completeInvite,
};
