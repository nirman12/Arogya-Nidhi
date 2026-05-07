# Payment Integration Setup Guide (Khalti & eSewa)

## Overview
This document outlines the complete Khalti and eSewa payment integration for the Arogya Nidhi appointment booking system.

## ✅ Completed Implementation

### 1. **Backend Components**

#### Payment Controller (`backend/controllers/paymentController.js`)
- `verifyKhalti()` - Verifies Khalti payment tokens via Khalti API
- `verifyEsewa()` - Verifies eSewa transaction IDs via eSewa API
- `recordPayment()` - Writes payment record to Supabase `payments` table and updates `appointments` table

#### Payment Routes (`backend/routes/payment.route.js`)
```
POST /api/payments/khalti   - Verify and record Khalti payment
POST /api/payments/esewa    - Verify and record eSewa payment
```

Both routes require `authUser` middleware (user must be logged in).

#### Server Integration (`backend/server.js`)
Payment routes are registered: `app.use('/api/payments', paymentRoutes)`

### 2. **Frontend Components**

#### Payment Page (`frontend/src/pages/Payment.jsx`)
- Displays appointment details: doctor name, specialty, date, time, consultation fee
- Two payment buttons:
  - **"Pay with Khalti"** - Opens Khalti Checkout SDK
  - **"Pay with eSewa"** - Submits hidden form to eSewa
- On successful payment, calls backend verification endpoint

#### Payment Success Page (`frontend/src/pages/PaymentSuccess.jsx`)
- Callback handler for eSewa success redirect
- Fetches appointment amount and verifies payment on backend
- Updates appointment status to `CONFIRMED`

#### Payment Failure Page (`frontend/src/pages/PaymentFailure.jsx`)
- Callback handler for eSewa failure redirect
- Notifies user of payment failure

#### Doctor Profile Page (`frontend/src/pages/DoctorProfile.jsx`)
- **Consultation Fee field** already implemented
- Located in "Professional Information" section
- Input: `<input type="number" name="consultationFee" ... />`
- Updates via: `POST /api/auth/doctor/update-profile`

### 3. **Environment Variables**

#### Backend `.env` (Updated)
```env
# Khalti Payment Gateway
KHALTI_PUBLIC_KEY=your_khalti_public_key_here
KHALTI_SECRET_KEY=your_khalti_secret_key_here

# eSewa Payment Gateway
ESEWA_SELLER_CODE=your_esewa_merchant_code_here
ESEWA_SELLER_PASSWORD=your_esewa_password_here
```

#### Frontend `.env` (Already has)
```env
VITE_KHALTI_PUBLIC_KEY=your_khalti_public_key_here
VITE_ESEWA_SELLER_CODE=your_esewa_seller_code_here
VITE_FRONTEND_URL=http://localhost:3000
```

## 🔧 Next Steps - Setup Instructions

### 1. **Get Payment Gateway Credentials**

**Khalti:**
- Sign up at: https://khalti.com/
- Go to Settings → API Credentials
- Copy Public Key and Secret Key

**eSewa:**
- Register merchant account at: https://esewa.com.np/
- Contact eSewa support for merchant code and password
- Get merchant credentials after approval

### 2. **Add Credentials to Environment Files**

**Backend** (`backend/.env`):
```env
KHALTI_PUBLIC_KEY=<your_khalti_public_key>
KHALTI_SECRET_KEY=<your_khalti_secret_key>
ESEWA_SELLER_CODE=<your_esewa_merchant_code>
ESEWA_SELLER_PASSWORD=<your_esewa_password>
```

**Frontend** (`frontend/.env`):
```env
VITE_KHALTI_PUBLIC_KEY=<your_khalti_public_key>
VITE_ESEWA_SELLER_CODE=<your_esewa_seller_code>
VITE_FRONTEND_URL=http://localhost:3000  # Change for production
```

### 3. **Doctor Setup Consultation Fees**

Doctors can update their consultation fees:
1. Login to doctor portal
2. Go to "Doctor Portal" → "Profile"
3. Scroll to "Professional Information" section
4. Enter "Consultation Fee (₹)"
5. Click "Save Changes"

### 4. **Patient Booking Flow**

1. Patient books appointment → redirected to `/payment/:appointmentId`
2. Confirms appointment details on payment page
3. Clicks "Pay with Khalti" or "Pay with eSewa"
4. Completes payment on respective gateway
5. Backend verifies payment and updates appointment status
6. Patient redirected to appointments list with confirmation

## 📊 Database Flow

### Payments Table (`public.payments`)
```sql
- appointment_id (uuid) - foreign key to appointments
- amount (numeric) - consultation fee
- currency (text) - "NPR" (hardcoded)
- status (text) - "PAID"
- gateway (text) - "khalti" or "esewa"
- gateway_ref (text) - transaction ID from gateway
- paid_at (timestamp) - when payment was recorded
```

### Appointments Table Update
- `payment` field set to `true`
- `status` updated to `"CONFIRMED"`

## 🔐 Security Notes

1. **Backend Verification**: Payment tokens are verified on the backend using gateway APIs
2. **User Authorization**: Only authenticated users can initiate payments
3. **Appointment Ownership**: System verifies user owns the appointment before payment
4. **Amount Validation**: Backend verifies amount matches doctor's consultation fee
5. **Production**: Use test credentials first, then switch to production keys

## 🧪 Testing

### Local Testing with Test Credentials
1. Register test accounts on Khalti & eSewa sandbox
2. Add test credentials to .env files
3. Start backend: `npm start` (in backend directory)
4. Start frontend: `npm run dev` (in frontend directory)
5. Book appointment and test payment flow

### Test Flow
```
Patient Portal → Book Appointment → Payment Page → 
Select Gateway → Complete Payment → 
Backend Verifies → Appointment Confirmed
```

## 📝 API Endpoints Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/payments/khalti` | POST | Bearer Token | Verify Khalti payment |
| `/api/payments/esewa` | POST | Bearer Token | Verify eSewa payment |
| `/api/auth/doctor/update-profile` | POST | Bearer Token | Update doctor profile (including fee) |
| `/payment/success` | GET | None | eSewa success callback |
| `/payment/failure` | GET | None | eSewa failure callback |

## 🚀 Production Deployment

1. Update `VITE_FRONTEND_URL` to your production domain
2. Use production API keys (not test keys)
3. Ensure HTTPS is enabled
4. Set `NODE_ENV=production` on backend
5. Configure CORS for your production domain

## ❓ Troubleshooting

### "Khalti public key not configured"
- Check `VITE_KHALTI_PUBLIC_KEY` in frontend `.env`

### "eSewa seller code not configured"
- Check `VITE_ESEWA_SELLER_CODE` in frontend `.env`

### Payment verification fails
- Verify backend has `KHALTI_SECRET_KEY` and `ESEWA_SELLER_CODE`
- Check network requests in browser DevTools
- Review backend logs for API responses

### Doctor can't update consultation fee
- Ensure doctor is logged in with correct role
- Check if consultation fee field is populated
- Verify `/api/auth/doctor/update-profile` endpoint is working

## 📞 Support

For issues, check:
1. Browser console for frontend errors
2. Backend server logs for API errors
3. Network tab in DevTools for request/response details
