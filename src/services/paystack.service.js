import { secretKey } from '../config/paystack.js';
import { logger } from '../utils/logger.js';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

class PaystackService {
  static async initializeTransaction({ email, amount, reference }) {
    try {
      const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: Math.round(amount * 100), // convert to kobo
          reference,
        }),
      });

      const data = await response.json();
      if (!data.status) {
        throw new Error(data.message || 'Paystack initialization failed');
      }

      return {
        authorizationUrl: data.data.authorization_url,
        accessCode: data.data.access_code,
        reference: data.data.reference,
      };
    } catch (error) {
      logger.error('PaystackService.initializeTransaction error', { error: error.message });
      throw error;
    }
  }

  static async verifyTransaction(reference) {
    try {
      const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${secretKey}` },
      });

      const data = await response.json();
      if (!data.status) {
        throw new Error(data.message || 'Paystack verification failed');
      }

      return {
        status: data.data.status,
        reference: data.data.reference,
        amount: data.data.amount / 100,
        paidAt: data.data.paid_at,
        channel: data.data.channel,
        customerEmail: data.data.customer.email,
      };
    } catch (error) {
      logger.error('PaystackService.verifyTransaction error', { error: error.message });
      throw error;
    }
  }

  static async transferToRecipient({ amount, recipientAccount, recipientBankCode, recipientName }) {
    try {
      const response = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'balance',
          amount: Math.round(amount * 100),
          recipient: recipientAccount,
          reason: 'Escrow release',
        }),
      });

      const data = await response.json();
      if (!data.status) {
        throw new Error(data.message || 'Paystack transfer failed');
      }

      return data.data;
    } catch (error) {
      logger.error('PaystackService.transferToRecipient error', { error: error.message });
      throw error;
    }
  }
}

export default PaystackService;


