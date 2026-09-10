import crypto from 'crypto';
import prisma from '../config/prisma.js';
import { logger } from '../utils/logger.js';

class OtpService {
  /**
   * Generates a secure 6-digit numeric OTP
   */
  generateCode() {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Store and generate OTP
   * @param {string} email
   * @param {'REGISTRATION' | 'PASSWORD_RESET'} type
   * @param {string} [userId]
   * @returns {Promise<string>}
   */
  async createOtp(email, type = 'REGISTRATION', userId = null) {
    const normalizedEmail = email.trim().toLowerCase();
    const otp = this.generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Mark prior unused OTPs for this email and type as used
    await prisma.otpVerification.updateMany({
      where: {
        email: normalizedEmail,
        type,
        used: false,
      },
      data: { used: true },
    });

    await prisma.otpVerification.create({
      data: {
        email: normalizedEmail,
        otp,
        type,
        expiresAt,
        userId,
      },
    });

    logger.info(`Generated ${type} OTP for ${normalizedEmail}: ${otp}`);
    return otp;
  }

  /**
   * Validate OTP
   * @param {string} email
   * @param {string} otp
   * @param {'REGISTRATION' | 'PASSWORD_RESET'} type
   * @returns {Promise<boolean>}
   */
  async verifyOtp(email, otp, type = 'REGISTRATION') {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp || '').trim();

    if (!cleanOtp) return false;

    const record = await prisma.otpVerification.findFirst({
      where: {
        email: normalizedEmail,
        otp: cleanOtp,
        type,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return false;
    }

    // Mark as used
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { used: true },
    });

    return true;
  }
}

export const otpService = new OtpService();
