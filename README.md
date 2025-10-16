# NovaChain — Bitcoin Portal

This React app is a **read-only Bitcoin dashboard** for the NovaChain brand.

Features:
- Enter any Bitcoin Bech32 address (bc1...) to view on-chain balance and recent transactions (using Blockstream public API).
- Admin mode unlocked when the entered address matches `REACT_APP_ADMIN_ADDRESS`.
- Export transactions as CSV and generate QR code for the address.
- Read-only: the app does not ask for or handle private keys.

## Run locally
1. `npm install`
2. `npm start`

## Build
`npm run build`

## Deploy on Render
1. Push repository to GitHub.
2. Create a Static Site on Render and connect the repo.
3. Set environment variable `REACT_APP_ADMIN_ADDRESS` to your admin BTC address.
4. Build command: `npm run build`; Publish directory: `build`
