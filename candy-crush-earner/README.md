# Candy Crush Earner (Candy Match and Earn)

A React Native match-3 game where players can earn points and withdraw them as cash via PayPal.

## Features
- **Match-3 Engine**: Full match-3 gameplay with cascading, shuffling, and special candies.
- **Special Candies**: Line Horizontal/Vertical, Bombs, and Color Bombs with unique effects.
- **Firebase Integration**: Anonymous authentication and cloud syncing of player progress and points.
- **Ad Monetization**: Integrated with Google Mobile Ads (Banner, Interstitial, and Rewarded ads).
- **Wallet & Payouts**: Real-time withdrawal system using a Node.js backend with PayPal Payouts API.

## Project Structure
- `candy-crush-earner/`: React Native mobile application.
- `server/`: Node.js withdrawal server.

## Setup Instructions

### 1. Mobile App Setup
1. Navigate to the app directory:
   ```bash
   cd candy-crush-earner
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure `src/constants/Config.ts` with your AdMob IDs and other settings.
4. Configure `src/screens/WalletScreen.tsx` with your server's IP address:
   ```typescript
   const SERVER_URL = 'http://YOUR_SERVER_IP:3000';
   ```
5. Run the app:
   ```bash
   npm run android # or npm run ios
   ```

### 2. Server Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure `.env` with your PayPal Client ID and Secret:
   ```env
   PAYPAL_CLIENT_ID=your_client_id
   PAYPAL_SECRET=your_secret
   PORT=3000
   ```
4. Start the server:
   ```bash
   node index.js
   ```

## Earning & Withdrawal Logic
- **Earning**: Players earn 10 points for every candy matched. Special candy matches trigger additional clears and points.
- **Withdrawal**: Players can withdraw once they reach the `WITHDRAWAL_THRESHOLD` (default 5000 points). Points are converted at a rate of 1000 points = $1.00 USD.

## Technologies Used
- **Frontend**: React Native, Reanimated 3, React Navigation.
- **Backend**: Node.js, Express, Axios.
- **Database/Auth**: Firebase Firestore, Firebase Auth.
- **Payments**: PayPal Payouts SDK.
- **Ads**: Google Mobile Ads SDK.
