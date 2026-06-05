require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PAYPAL_API = 'https://api-m.sandbox.paypal.com'; // Use https://api-m.paypal.com for live

// Helper to get PayPal Access Token
async function getPayPalAccessToken() {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64');
  const response = await axios({
    url: `${PAYPAL_API}/v1/oauth2/token`,
    method: 'post',
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en_US',
      Authorization: `Basic ${auth}`,
    },
    data: 'grant_type=client_credentials',
  });
  return response.data.access_token;
}

// Helper for PayHero Payout
async function processPayHeroPayout(phoneNumber, amountKes, points) {
  const auth = Buffer.from(`${process.env.PAYHERO_USERNAME}:${process.env.PAYHERO_PASSWORD}`).toString('base64');
  const url = 'https://backend.payhero.co.ke/api/v2/withdraw';

  const response = await axios.post(url, {
    amount: Math.round(amountKes),
    phone_number: phoneNumber,
    network_code: '63902', // Default to MPESA
    external_reference: `Payout_${Date.now()}`,
    callback_url: process.env.CALLBACK_URL || 'https://yourdomain.com/callback',
    channel: 'mobile',
    channel_id: parseInt(process.env.PAYHERO_CHANNEL_ID),
    payment_service: 'b2c'
  }, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data;
}

// Callback Endpoint for PayHero
app.post('/callback', (req, res) => {
  const apiSecret = req.headers['api-secret'] || req.headers['x-api-secret'];

  if (process.env.PAYHERO_API_SECRET && apiSecret !== process.env.PAYHERO_API_SECRET) {
    console.warn('Unauthorized callback attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('PayHero Callback received:', req.body);
  // Implement your logic to handle payout success/failure here
  res.json({ success: true });
});

// Verification Endpoint
app.get('/verify/:reference', async (req, res) => {
  const { reference } = req.params;
  const auth = Buffer.from(`${process.env.PAYHERO_USERNAME}:${process.env.PAYHERO_PASSWORD}`).toString('base64');
  const url = `https://backend.payhero.co.ke/api/v2/transactions/verify/${reference}`;

  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Verification Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to verify transaction' });
  }
});

// Withdrawal Endpoint
app.post('/withdraw', async (req, res) => {
  const { method, email, phoneNumber, amount, points } = req.body;

  if (method === 'payhero') {
    if (!phoneNumber || !amount) {
      return res.status(400).json({ error: 'Missing phone number or amount' });
    }

    try {
      // 1 USD = 130 KES approx. You can adjust this or use an API
      const amountKes = amount * 130; 
      const result = await processPayHeroPayout(phoneNumber, amountKes, points);
      
      if (result.status === 'success' || result.success) {
        res.json({ success: true, batch_id: result.reference || result.checkout_request_id });
      } else {
        res.status(400).json({ error: result.message || 'PayHero payout failed' });
      }
    } catch (error) {
      console.error('PayHero Payout Error:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'Failed to process PayHero payout', details: error.response ? error.response.data : error.message });
    }
  } else {
    // Default to PayPal
    if (!email || !amount) {
      return res.status(400).json({ error: 'Missing email or amount' });
    }

    try {
      const accessToken = await getPayPalAccessToken();
      
      const payoutResponse = await axios({
        url: `${PAYPAL_API}/v1/payments/payouts`,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        data: {
          sender_batch_header: {
            sender_batch_id: `Payouts_${Date.now()}`,
            email_subject: 'You have a payout!',
            email_message: `You have received a payout for your points in Candy Crush Earner! Total points: ${points}`,
          },
          items: [
            {
              recipient_type: 'EMAIL',
              amount: {
                value: amount.toFixed(2),
                currency: 'USD',
              },
              note: 'Thanks for playing Candy Crush Earner!',
              receiver: email,
              sender_item_id: `Item_${Date.now()}`,
            },
          ],
        },
      });

      res.json({ success: true, batch_id: payoutResponse.data.batch_header.payout_batch_id });
    } catch (error) {
      console.error('PayPal Payout Error:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'Failed to process PayPal payout', details: error.response ? error.response.data : error.message });
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Withdrawal server running on port ${PORT}`));
