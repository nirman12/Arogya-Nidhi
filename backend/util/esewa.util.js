import crypto from 'crypto';

export function generateEsewaSignature({ total_amount, transaction_uuid, product_code, secretKey }) {
  const data = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
  const hash = crypto.createHmac('sha256', secretKey).update(data).digest('base64');
  return hash;
}

export function verifyEsewaSignature({ total_amount, transaction_uuid, product_code, signature, secretKey }) {
  const expectedSignature = generateEsewaSignature({ total_amount, transaction_uuid, product_code, secretKey });
  return signature === expectedSignature;
}
