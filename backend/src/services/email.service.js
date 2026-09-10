import axios from 'axios';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Brevo Transactional Email Service
 */
class EmailService {
  constructor() {
    this.apiUrl = env.BREVO_API_URL || 'https://api.brevo.com/v3';
    this.apiKey = env.BREVO_API_KEY;
    this.sender = {
      name: env.BREVO_SENDER_NAME || 'Somnera Mattress',
      email: env.BREVO_SENDER_EMAIL || 'somneramattresses@gmail.com',
    };
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey !== 'your_brevo_api_key');
  }

  async sendEmail({ to, subject, htmlContent }) {
    if (!this.isConfigured()) {
      logger.info(`[BREVO SIMULATION] Transactional email to ${to}:`);
      logger.info(`Subject: ${subject}`);
      logger.info(`Content: ${htmlContent.replace(/<[^>]*>?/gm, '').trim()}`);
      return { success: true, simulated: true };
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/smtp/email`,
        {
          sender: this.sender,
          to: [{ email: to }],
          subject,
          htmlContent,
        },
        {
          headers: {
            'api-key': this.apiKey,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 10000,
        }
      );

      logger.info(`Brevo email dispatched to ${to}. MessageId: ${response.data?.messageId}`);
      return { success: true, messageId: response.data?.messageId };
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      logger.error(`Failed to send Brevo email to ${to}: ${errorMsg}`);
      // Don't crash the server if Brevo rate-limits or network blips
      return { success: false, error: errorMsg };
    }
  }

  async sendOtpEmail(to, otp, purpose = 'Account Verification') {
    const subject = `Your Somnera Mattress Verification Code: ${otp}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: bold;">Somnera Mattress</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Elegance in Every Dream</p>
        </div>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; text-align: center; margin-bottom: 20px;">
          <p style="color: #334155; font-size: 16px; margin: 0 0 12px;">Here is your one-time code for <strong>${purpose}</strong>:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1e293b; padding: 10px 0;">
            ${otp}
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 12px;">This code is valid for 10 minutes. Do not share it with anyone.</p>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
          If you did not request this verification code, please ignore this email or contact support at ${this.sender.email}.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} Somnera Mattress. All rights reserved.
        </p>
      </div>
    `;

    return this.sendEmail({ to, subject, htmlContent });
  }

  async sendPasswordResetEmail(to, otp) {
    const subject = `Reset Your Somnera Mattress Password`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0f172a; margin: 0; font-size: 24px;">Somnera Mattress</h1>
          <p style="color: #64748b; font-size: 14px;">Password Reset Request</p>
        </div>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; text-align: center; margin-bottom: 20px;">
          <p style="color: #334155; font-size: 15px;">Use the code below to reset your Somnera password:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0284c7; padding: 10px 0;">
            ${otp}
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 8px;">This code will expire in 10 minutes.</p>
        </div>
        <p style="color: #64748b; font-size: 13px;">
          If you didn't ask to reset your password, you can safely ignore this email.
        </p>
      </div>
    `;

    return this.sendEmail({ to, subject, htmlContent });
  }

  async sendOrderConfirmationEmail(to, order) {
    const subject = `Order Confirmed: #${order.id.slice(-8).toUpperCase()} - Somnera Mattress`;
    const itemsList = (order.items || [])
      .map(
        (item) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 0; color: #334155;">${item.productName || 'Somnera Product'} ${item.size ? `(${item.size})` : ''} x ${item.quantity}</td>
          <td style="padding: 10px 0; text-align: right; color: #0f172a; font-weight: 500;">₹${item.itemTotal}</td>
        </tr>
      `
      )
      .join('');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-top: 0;">Thank you for your order!</h2>
        <p style="color: #64748b;">We're preparing your Somnera Mattress order for fulfillment.</p>
        <div style="margin: 20px 0; padding: 16px; background-color: #f8fafc; border-radius: 6px;">
          <p style="margin: 0 0 8px; font-weight: bold; color: #0f172a;">Order Details</p>
          <p style="margin: 0; color: #64748b; font-size: 14px;">Order ID: #${order.id}</p>
          <p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">Total Amount: ₹${order.totalAmount}</p>
          <p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">Payment Status: ${order.paymentStatus}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="border-bottom: 2px solid #cbd5e1; text-align: left;">
              <th style="padding: 8px 0; color: #475569;">Item</th>
              <th style="padding: 8px 0; text-align: right; color: #475569;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList}
          </tbody>
        </table>
        <p style="color: #64748b; font-size: 13px;">
          We will send you another update with tracking information as soon as your shipment departs.
        </p>
      </div>
    `;

    return this.sendEmail({ to, subject, htmlContent });
  }
}

export const emailService = new EmailService();
