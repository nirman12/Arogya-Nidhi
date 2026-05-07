import axios from 'axios';
import supabase from '../config/supabase.js';
import { generateEsewaSignature, verifyEsewaSignature } from '../util/esewa.util.js';

// API endpoints
const KHALTI_INITIATE_URL = 'https://dev.khalti.com/api/v2/epayment/initiate/';
const KHALTI_LOOKUP_URL = 'https://dev.khalti.com/api/v2/epayment/lookup/';
const ESEWA_VERIFY_URL = 'https://rc.esewa.com.np/api/epay/transaction/status/';

// ─────────────────────────────────────────────────────────────────
// eSewa: Initiate Payment
// ─────────────────────────────────────────────────────────────────
export const esewaInitiate = async (req, res) => {
  try {
    const { userId } = req.user;
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ status: 'Failure', message: 'appointmentId required' });
    }

    // Fetch appointment with doctor details
    const { data: appointment, error: apptErr } = await supabase
      .from('appointments')
      .select(`
        *,
        doctor:doctor_profiles(
          id,
          consultation_fee,
          user:users(name)
        )
      `)
      .eq('id', appointmentId)
      .maybeSingle();

    if (apptErr || !appointment) {
      return res.status(404).json({ status: 'Failure', message: 'Appointment not found' });
    }

    if (appointment.patient_id !== userId) {
      return res.status(403).json({ status: 'Failure', message: 'Not authorized to pay for this appointment' });
    }

    // Check if already paid
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('appointment_id', appointmentId)
      .eq('status', 'PAID')
      .maybeSingle();

    if (existingPayment) {
      return res.status(400).json({ status: 'Failure', message: 'Appointment already paid' });
    }

    const amount = Number(appointment.doctor?.consultation_fee) || 0;
    if (amount <= 0) {
      return res.status(400).json({ status: 'Failure', message: 'Invalid consultation fee' });
    }

    // Calculate taxes
    let tax_amount = 0.1 * amount;
    tax_amount = Number(tax_amount.toPrecision(2));
    const service_charge = 0;
    const delivery_charge = 0;
    const transaction_uuid = `TXN-${appointmentId}-${Date.now()}`;
    const total_amount = amount + tax_amount + service_charge + delivery_charge;

    // Generate signature
    const signature = generateEsewaSignature({
      total_amount,
      transaction_uuid,
      product_code: process.env.ESEWA_SELLER_CODE,
      secretKey: process.env.ESEWA_SECRET,
    });

    // Create transaction tracking record
    const { data: txnRecord, error: txnErr } = await supabase
      .from('payments')
      .insert({
        appointment_id: appointmentId,
        amount: total_amount,
        currency: 'NPR',
        status: 'INITIATED',
        gateway: 'esewa',
        gateway_ref: transaction_uuid,
        created_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (txnErr) {
      return res.status(500).json({ status: 'Failure', message: 'Failed to create transaction record' });
    }

    // Build eSewa payload
    const payload = {
      amount,
      tax_amount,
      total_amount,
      transaction_uuid,
      product_code: process.env.ESEWA_SELLER_CODE,
      product_service_charge: service_charge,
      product_delivery_charge: delivery_charge,
      success_url: process.env.ESEWA_SUCCESS_URL,
      failure_url: process.env.ESEWA_FAILURE_URL,
      signed_field_names: 'total_amount,transaction_uuid,product_code',
      signature,
    };

    return res.status(200).json({
      status: 'Success',
      payload,
      message: 'eSewa payload generated',
    });
  } catch (error) {
    console.error('eSewa initiate error:', error);
    return res.status(500).json({
      status: 'Failure',
      message: 'Something went wrong. Please try again later.',
    });
  }
};

// ─────────────────────────────────────────────────────────────────
// eSewa: Success Callback
// ─────────────────────────────────────────────────────────────────
export const esewaSuccess = async (req, res) => {
  try {
    const { userId } = req.user;
    const encodedData = String(req.body.data || '');
    
    if (!encodedData) {
      return res.status(400).json({ status: 'Failure', message: 'Missing data' });
    }

    // Decode base64 data
    const decodedData = Buffer.from(encodedData, 'base64').toString('utf-8');
    const finalData = JSON.parse(decodedData);

    // Verify amount matches
    const { data: payment, error: paymentErr } = await supabase
      .from('payments')
      .select('*')
      .eq('gateway_ref', finalData.transaction_uuid)
      .eq('status', 'INITIATED')
      .maybeSingle();

    if (paymentErr || !payment) {
      return res.status(400).json({ status: 'Failure', message: 'Invalid transaction' });
    }

    if (parseFloat(finalData.total_amount) !== payment.amount) {
      return res.status(400).json({ status: 'Failure', message: 'Amount mismatch' });
    }

    // Verify with eSewa API
    const esewaCheckUrl = `${ESEWA_VERIFY_URL}?product_code=${process.env.ESEWA_SELLER_CODE}&total_amount=${payment.amount}&transaction_uuid=${finalData.transaction_uuid}`;
    
    const esewaResponse = await axios.get(esewaCheckUrl);
    const esewaData = esewaResponse.data;

    if (esewaData.status !== 'COMPLETE') {
      return res.status(400).json({ status: 'Failure', message: 'Payment not completed on eSewa' });
    }

    // Update payment record
    const { error: updateErr } = await supabase
      .from('payments')
      .update({
        status: 'PAID',
        paid_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    if (updateErr) {
      return res.status(500).json({ status: 'Failure', message: 'Failed to update payment' });
    }

    // Update appointment
    const { error: apptErr } = await supabase
      .from('appointments')
      .update({
        status: 'CONFIRMED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.appointment_id);

    if (apptErr) {
      return res.status(500).json({ status: 'Failure', message: 'Failed to confirm appointment' });
    }

    return res.status(200).json({
      status: 'Success',
      message: 'Payment successful',
      data: decodedData,
    });
  } catch (error) {
    console.error('eSewa success error:', error);
    return res.status(500).json({
      status: 'Failure',
      message: 'Something went wrong. Please try again later.',
    });
  }
};

// ─────────────────────────────────────────────────────────────────
// eSewa: Failure Callback
// ─────────────────────────────────────────────────────────────────
export const esewaFailure = async (req, res) => {
  try {
    const { userId } = req.user;
    const encodedData = String(req.body.data || '');

    if (!encodedData) {
      return res.status(400).json({ status: 'Failure', message: 'Missing data' });
    }

    const decodedData = Buffer.from(encodedData, 'base64').toString('utf-8');
    const failureData = JSON.parse(decodedData);

    // Update payment record status to FAILED
    const { error: updateErr } = await supabase
      .from('payments')
      .update({
        status: 'FAILED',
        updated_at: new Date().toISOString(),
      })
      .eq('gateway_ref', failureData.transaction_uuid);

    if (updateErr) {
      console.error('Failed to update payment to FAILED:', updateErr);
    }

    return res.status(200).json({
      status: 'Failure',
      message: 'Payment failed or cancelled',
      data: decodedData,
    });
  } catch (error) {
    console.error('eSewa failure error:', error);
    return res.status(500).json({
      status: 'Failure',
      message: 'Something went wrong. Please try again later.',
    });
  }
};

// ─────────────────────────────────────────────────────────────────
// Khalti: Initiate Payment
// ─────────────────────────────────────────────────────────────────
export const khaltiInitiate = async (req, res) => {
  try {
    const { userId } = req.user;
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ status: 'Failure', message: 'appointmentId required' });
    }

    // Fetch appointment with doctor details
    const { data: appointment, error: apptErr } = await supabase
      .from('appointments')
      .select(`
        *,
        doctor:doctor_profiles(
          id,
          consultation_fee,
          user:users(name)
        ),
        patient:patients(
          user:users(name, email, phone)
        )
      `)
      .eq('id', appointmentId)
      .maybeSingle();

    if (apptErr || !appointment) {
      return res.status(404).json({ status: 'Failure', message: 'Appointment not found' });
    }

    if (appointment.patient_id !== userId) {
      return res.status(403).json({ status: 'Failure', message: 'Not authorized' });
    }

    // Check if already paid
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('appointment_id', appointmentId)
      .eq('status', 'PAID')
      .maybeSingle();

    if (existingPayment) {
      return res.status(400).json({ status: 'Failure', message: 'Appointment already paid' });
    }

    const amount = Number(appointment.doctor?.consultation_fee) || 0;
    if (amount <= 0) {
      return res.status(400).json({ status: 'Failure', message: 'Invalid consultation fee' });
    }

    const purchase_order_id = `${userId}_${appointmentId}_${Date.now()}`;
    const purchase_order_name = `Consultation-${appointmentId}`;

    const customer_info = {
      name: appointment.patient?.user?.name || 'Patient',
      email: appointment.patient?.user?.email || '',
      phone: appointment.patient?.user?.phone || '',
    };

    // Amount in paisa (multiply by 100 for Khalti)
    const amountInPaisa = Math.round(amount * 100);

    const khaltiPayload = {
      return_url: process.env.KHALTI_RETURN_URL,
      website_url: process.env.KHALTI_WEBSITE_URL,
      amount: amountInPaisa,
      purchase_order_id,
      purchase_order_name,
      customer_info,
    };

    // Call Khalti API to get payment URL
    const khaltiResponse = await axios.post(KHALTI_INITIATE_URL, khaltiPayload, {
      headers: {
        Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const khaltiData = khaltiResponse.data;

    if (!khaltiData.pidx) {
      return res.status(400).json({ status: 'Failure', message: 'Failed to get Khalti payment URL' });
    }

    // Create transaction tracking record
    const { error: txnErr } = await supabase
      .from('payments')
      .insert({
        appointment_id: appointmentId,
        amount,
        currency: 'NPR',
        status: 'INITIATED',
        gateway: 'khalti',
        gateway_ref: khaltiData.pidx,
        created_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (txnErr) {
      return res.status(500).json({ status: 'Failure', message: 'Failed to create transaction record' });
    }

    return res.status(200).json({
      status: 'Success',
      khalti_data: khaltiData,
      message: 'Khalti payment URL generated',
    });
  } catch (error) {
    console.error('Khalti initiate error:', error);
    return res.status(500).json({
      status: 'Failure',
      message: error?.response?.data?.message || 'Something went wrong. Please try again later.',
    });
  }
};

// ─────────────────────────────────────────────────────────────────
// Khalti: Verify Payment Status
// ─────────────────────────────────────────────────────────────────
export const khaltiPaymentStatus = async (req, res) => {
  try {
    const { userId } = req.user;
    const { pidx } = req.body;

    if (!pidx) {
      return res.status(400).json({ status: 'Failure', message: 'pidx required' });
    }

    // Lookup payment status from Khalti
    const khaltiLookup = await axios.post(
      KHALTI_LOOKUP_URL,
      { pidx },
      {
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      }
    );

    const khaltiData = khaltiLookup.data;

    // Find existing payment record by gateway_ref
    const { data: existingPayment, error: findErr } = await supabase
      .from('payments')
      .select('*')
      .eq('gateway_ref', pidx)
      .eq('status', 'INITIATED')
      .maybeSingle();

    if (findErr || !existingPayment) {
      return res.status(400).json({ status: 'Failure', message: 'Payment record not found' });
    }

    // Check if payment already processed
    const { data: processedPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('gateway_ref', pidx)
      .eq('status', 'PAID')
      .maybeSingle();

    if (processedPayment) {
      return res.status(200).json({
        status: 'Success',
        message: 'Payment already processed',
        data: khaltiData,
      });
    }

    // Verify payment is completed
    if (khaltiData.status === 'Completed' && !khaltiData.refunded) {
      // Update payment record
      const { error: updateErr } = await supabase
        .from('payments')
        .update({
          status: 'PAID',
          paid_at: new Date().toISOString(),
        })
        .eq('id', existingPayment.id);

      if (updateErr) {
        return res.status(500).json({ status: 'Failure', message: 'Failed to update payment' });
      }

      // Update appointment
      const { error: apptErr } = await supabase
        .from('appointments')
        .update({
          status: 'CONFIRMED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPayment.appointment_id);

      if (apptErr) {
        return res.status(500).json({ status: 'Failure', message: 'Failed to confirm appointment' });
      }

      return res.status(200).json({
        status: 'Success',
        message: 'Payment successful and appointment confirmed',
        data: khaltiData,
      });
    } else {
      // Payment failed or pending
      const { error: updateErr } = await supabase
        .from('payments')
        .update({
          status: 'FAILED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPayment.id);

      return res.status(400).json({
        status: 'Failure',
        message: 'Payment not completed or was refunded',
        data: khaltiData,
      });
    }
  } catch (error) {
    console.error('Khalti payment status error:', error);
    return res.status(500).json({
      status: 'Failure',
      message: 'Something went wrong. Please try again later.',
    });
  }
};
