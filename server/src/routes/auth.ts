import express from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  updateEmail,
  changePassword,
  refreshToken,
  checkUsernameAvailability,
  checkEmailAvailability,
  getMyInvitations,
  acceptInvitation,
  declineInvitation,
  verifyEmail,
  resendVerification,
  resendVerificationForLogin
} from '../controllers/auth';
import { loginValidation, passwordValidation, profileValidation, registerValidation, emailValidation } from '../middleware/validation';
import { googleAuth, googleCallback, googleUrl } from '../controllers/googleAuth';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    message: 'Too many registration attempts, please try again in an hour.'
  }
});

router.post('/google', googleAuth);
router.get('/google/url', googleUrl);
router.get('/google/callback', googleCallback);
router.post('/register', registerLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);
router.post('/logout', optionalAuth, logout);
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, profileValidation, updateProfile);
router.put('/email', authenticateToken, emailValidation, updateEmail);
router.put('/password', authenticateToken, passwordValidation, changePassword);
router.post('/refresh', refreshToken);
router.get('/check-username/:username', checkUsernameAvailability);
router.get('/check-email/:email', checkEmailAvailability);

router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/resend-verification-login', resendVerificationForLogin);

router.get('/invitations', authenticateToken, getMyInvitations);
router.post('/invitations/accept', authenticateToken, acceptInvitation);
router.post('/invitations/decline', authenticateToken, declineInvitation);

export default router;
