require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Helper for PayHero Payout
async function processPayHeroPayout(phoneNumber, amountKes, points) {
  const username = process.env.PAYHERO_USERNAME;
  const password = process.env.PAYHERO_PASSWORD;
  
  if (!username || !password) {
    throw new Error('PayHero credentials missing in environment variables');
  }

  const auth = Buffer.from(`${username}:${password}`).toString('base64');
  const url = 'https://backend.payhero.co.ke/api/v2/withdraw';

  // Ensure phone number starts with 254 for PayHero
  let formattedPhone = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '254' + formattedPhone.substring(1);
  }

  const externalReference = `Payout_${Date.now()}`;
  const payload = {
    amount: Math.round(amountKes),
    phone_number: formattedPhone,
    network_code: '63902', // MPESA
    external_reference: externalReference,
    callback_url: process.env.CALLBACK_URL,
    channel: 'mobile',
    payment_service: 'b2c'
  };

  // Add channel_id if provided
  if (process.env.PAYHERO_CHANNEL_ID) {
    payload.channel_id = parseInt(process.env.PAYHERO_CHANNEL_ID);
  }

  console.log(`[PayHero] Initiating Payout: ${externalReference} to ${formattedPhone}, Amount: ${amountKes} KES`);

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 seconds timeout
    });

    console.log('[PayHero] Response:', JSON.stringify(response.data));
    return { ...response.data, external_reference: externalReference };
  } catch (error) {
    const errorData = error.response ? error.response.data : error.message;
    console.error('[PayHero] Error:', JSON.stringify(errorData));
    throw error;
  }
}

// Callback Endpoint for PayHero
app.post('/callback', (req, res) => {
  const apiSecret = req.headers['api-secret'] || req.headers['x-api-secret'];

  if (process.env.PAYHERO_API_SECRET && apiSecret !== process.env.PAYHERO_API_SECRET) {
    console.warn('[Callback] Unauthorized attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('[Callback] PayHero data received:', JSON.stringify(req.body));
  
  // Here you would typically update your database with the payout result
  // e.g., if (req.body.status === 'Success') { ... }
  
  res.json({ success: true });
});

// Verification Endpoint
app.get('/verify/:reference', async (req, res) => {
  const { reference } = req.params;
  const auth = Buffer.from(`${process.env.PAYHERO_USERNAME}:${process.env.PAYHERO_PASSWORD}`).toString('base64');
  const url = `https://backend.payhero.co.ke/api/v2/transactions/verify/${reference}`;

  console.log(`[Verify] Checking transaction: ${reference}`);

  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    res.json(response.data);
  } catch (error) {
    const errorData = error.response ? error.response.data : error.message;
    console.error('[Verify] Error:', JSON.stringify(errorData));
    res.status(500).json({ error: 'Failed to verify transaction', details: errorData });
  }
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Withdrawal Endpoint
app.post('/withdraw', async (req, res) => {
  const { method, phoneNumber, amount, points } = req.body;

  console.log(`[Withdraw] Request received: ${amount} USD (${points} pts) for ${phoneNumber}`);

  if (method !== 'payhero') {
    return res.status(400).json({ error: 'Invalid method. Only payhero is supported.' });
  }

  if (!phoneNumber || !amount) {
    return res.status(400).json({ error: 'Missing phone number or amount' });
  }

  try {
    // Current approx rate: 1 USD = 128 KES (slightly adjusted for safety)
    const rate = 128;
    const amountKes = amount * rate; 
    
    if (amountKes < 10) {
      return res.status(400).json({ error: 'Amount too small for payout (Min 10 KES)' });
    }

    const result = await processPayHeroPayout(phoneNumber, amountKes, points);
    
    // PayHero B2C often returns success: true or status: 'success'
    const isSuccess = result.success || result.status === 'success' || result.status === 'Success' || result.response_code === '00';
    
    if (isSuccess) {
      res.json({ 
        success: true, 
        message: 'Payout initiated successfully',
        batch_id: result.reference || result.external_reference || result.checkout_request_id 
      });
    } else {
      res.status(400).json({ 
        error: result.message || 'PayHero payout failed to initiate',
        details: result
      });
    }
  } catch (error) {
    const errorDetails = error.response ? error.response.data : error.message;
    res.status(500).json({ 
      error: 'Internal server error during payout', 
      details: errorDetails 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Withdrawal server running on port ${PORT}`));
