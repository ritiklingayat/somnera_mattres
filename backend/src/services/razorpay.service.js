import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

class RazorpayService {
  constructor() {
    this.keyId = env.RAZORPAY_KEY_ID;
    this.keySecret = env.RAZORPAY_KEY_SECRET;
    this.instance = null;

    if (this.keyId && this.keySecret && !this.keyId.startsWith('your_')) {
      try {
        this.instance = new Razorpay({
          key_id: this.keyId,
          key_secret: this.keySecret,
        });
      } catch (err) {
        logger.warn('Razorpay initialization notice:', err.message);
      }
    }
  }

  isLive() {
    return Boolean(this.instance && !this.keyId.startsWith('rzp_test_somnera'));
  }

  /**
   * Create Razorpay Order
   * @param {Object} params
   * @param {number} params.amountInPaise
   * @param {string} params.receipt
   * @param {string} [params.currency='INR']
   * @param {Object} [params.notes={}]
   */
  async createOrder({ amountInPaise, receipt, currency = 'INR', notes = {} }) {
    if (this.instance && this.isLive()) {
      try {
        const order = await this.instance.orders.create({
          amount: Math.round(amountInPaise),
          currency,
          receipt,
          notes,
        });
        return {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
          status: order.status,
          keyId: this.keyId,
        };
      } catch (error) {
        logger.error('Razorpay order creation error:', error);
        throw error;
      }
    }

    // Dev / Test simulation mode
    const simulatedOrderId = `order_${receipt || 'rcpt'}_${Date.now()}`;
    logger.info(`[RAZORPAY SIMULATION] Created order ${simulatedOrderId} for amount: ₹${amountInPaise / 100}`);

    return {
      id: simulatedOrderId,
      amount: Math.round(amountInPaise),
      currency,
      receipt,
      status: 'created',
      keyId: this.keyId,
      simulated: true,
    };
  }

  /**
   * Cryptographically verify payment signature
   * @param {Object} params
   * @param {string} params.razorpayOrderId
   * @param {string} params.razorpayPaymentId
   * @param {string} params.razorpaySignature
   */
  verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    if (!razorpayOrderId || !razorpayPaymentId) {
      return false;
    }

    // If explicit dev simulated payment bypass signature
    if (
      !this.isLive() &&
      (razorpaySignature === 'simulated_signature' || razorpaySignature === `sig_${razorpayPaymentId}`)
    ) {
      return true;
    }

    try {
      const generatedSignature = crypto
        .createHmac('sha256', this.keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      return generatedSignature === razorpaySignature;
    } catch (err) {
      logger.error('Signature verification error:', err);
      return false;
    }
  }
}

export const razorpayService = new RazorpayService();
