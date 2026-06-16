// lib/mpesa.ts
// M-Pesa Daraja API service for STK Push and callbacks

import axios from 'axios'

interface MpesaConfig {
  consumerKey: string
  consumerSecret: string
  passkey: string
  shortcode: string
  environment: 'sandbox' | 'production'
  callbackUrl: string
}

class MpesaService {
  private config: MpesaConfig
  private baseUrl: string
  private accessToken: string | null = null
  private tokenExpiry: Date | null = null

  constructor() {
    this.config = {
      consumerKey: process.env.MPESA_CONSUMER_KEY!,
      consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
      passkey: process.env.MPESA_PASSKEY!,
      shortcode: process.env.MPESA_SHORTCODE!,
      environment: (process.env.MPESA_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
      callbackUrl: process.env.MPESA_CALLBACK_URL!
    }
    
    this.baseUrl = this.config.environment === 'sandbox' 
      ? 'https://sandbox.safaricom.co.ke'
      : 'https://api.safaricom.co.ke'
  }

  // Get OAuth access token
  private async getAccessToken(): Promise<string> {
    // Check if token is still valid (10 minutes before expiry)
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken
    }

    const auth = Buffer.from(`${this.config.consumerKey}:${this.config.consumerSecret}`).toString('base64')
    
    try {
      const response = await axios.get(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
          Authorization: `Basic ${auth}`
        }
      })
      
      this.accessToken = response.data.access_token
      // Token expires in 3600 seconds, set expiry 50 minutes from now
      this.tokenExpiry = new Date(Date.now() + 50 * 60 * 1000)
      
      return this.accessToken
    } catch (error) {
      console.error('Failed to get M-Pesa access token:', error)
      throw new Error('M-Pesa authentication failed')
    }
  }

  // Generate password for STK Push
  private generatePassword(shortcode: string, passkey: string, timestamp: string): string {
    const str = `${shortcode}${passkey}${timestamp}`
    return Buffer.from(str).toString('base64')
  }

  // Initiate STK Push (Lipa Na M-Pesa Online)
  async stkPush(phoneNumber: string, amount: number, accountReference: string, transactionDesc: string = 'Rent Payment') {
    const token = await this.getAccessToken()
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)
    const password = this.generatePassword(this.config.shortcode, this.config.passkey, timestamp)
    
    // Format phone number to 254XXXXXXXXX
    const formattedPhone = phoneNumber.replace(/^0+/, '').replace(/^\+/, '')
    
    const requestBody = {
      BusinessShortCode: this.config.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: this.config.shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: this.config.callbackUrl,
      AccountReference: accountReference.slice(0, 12),
      TransactionDesc: transactionDesc.slice(0, 13)
    }

    try {
      const response = await axios.post(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, requestBody, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      return response.data
    } catch (error) {
      console.error('STK Push failed:', error)
      throw new Error('Failed to initiate payment')
    }
  }

  // Query STK Push status
  async stkPushQuery(checkoutRequestId: string) {
    const token = await this.getAccessToken()
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)
    const password = this.generatePassword(this.config.shortcode, this.config.passkey, timestamp)
    
    const requestBody = {
      BusinessShortCode: this.config.shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    }

    try {
      const response = await axios.post(`${this.baseUrl}/mpesa/stkpushquery/v1/query`, requestBody, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      return response.data
    } catch (error) {
      console.error('STK Push query failed:', error)
      throw new Error('Failed to query payment status')
    }
  }
}

export const mpesa = new MpesaService()