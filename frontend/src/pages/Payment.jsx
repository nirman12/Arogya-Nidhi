import React, { useContext, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';
import './Payment.css';

const Payment = () => {
  const { backendUrl, token } = useContext(AppContext);
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [processing, setProcessing] = useState(false);
  const esewaFormRef = useRef(null);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/appointments/${appointmentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAppointment(data);
      } catch (error) {
        toast.error('Failed to fetch appointment details');
        navigate('/patient-portal/appointments');
      }
    };

    if (token && appointmentId) {
      fetchAppointment();
    }
  }, [token, appointmentId, backendUrl, navigate]);

  // ─────────────────────────────────────────────────────────────────
  // eSewa Payment Handler
  // ─────────────────────────────────────────────────────────────────
  const payWithEsewa = async () => {
    try {
      setProcessing(true);

      // Call backend to get eSewa payload
      const { data: initiateResponse } = await axios.post(
        `${backendUrl}/api/payments/esewa/initiate`,
        { appointmentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (initiateResponse.status !== 'Success') {
        toast.error(initiateResponse.message || 'Failed to initiate eSewa payment');
        return;
      }

      const payload = initiateResponse.payload;

      // Populate and submit hidden form to eSewa
      if (esewaFormRef.current) {
        const form = esewaFormRef.current;
        form.amt.value = payload.amount;
        form.psc.value = payload.product_service_charge || 0;
        form.pdc.value = payload.product_delivery_charge || 0;
        form.txAmt.value = payload.tax_amount;
        form.tAmt.value = payload.total_amount;
        form.pid.value = payload.transaction_uuid;
        form.scd.value = payload.product_code;
        form.su.value = payload.success_url;
        form.fu.value = payload.failure_url;
        form.spn.value = 'Consultation Fee';
        form.sfn.value = payload.signed_field_names;
        form.sig.value = payload.signature;

        // Submit form to eSewa
        form.submit();
      }
    } catch (error) {
      console.error('eSewa initiate error:', error);
      toast.error(error?.response?.data?.message || 'Failed to initiate eSewa payment');
    } finally {
      setProcessing(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Khalti Payment Handler
  // ─────────────────────────────────────────────────────────────────
  const payWithKhalti = async () => {
    try {
      setProcessing(true);

      // Call backend to get Khalti payment URL
      const { data: initiateResponse } = await axios.post(
        `${backendUrl}/api/payments/khalti/initiate`,
        { appointmentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (initiateResponse.status !== 'Success') {
        toast.error(initiateResponse.message || 'Failed to initiate Khalti payment');
        return;
      }

      const khaltiData = initiateResponse.khalti_data;

      // Open Khalti payment URL
      if (khaltiData.payment_url) {
        window.location.href = khaltiData.payment_url;
      } else {
        toast.error('Invalid Khalti payment URL');
      }
    } catch (error) {
      console.error('Khalti initiate error:', error);
      toast.error(error?.response?.data?.message || 'Failed to initiate Khalti payment');
    } finally {
      setProcessing(false);
    }
  };

  if (!appointment) {
    return <div className="payment-container">Loading...</div>;
  }

  return (
    <div className="payment-container">
      <div className="payment-card">
        <h2>Confirm Your Appointment</h2>
        <div className="appointment-details">
          <p><strong>Doctor:</strong> {appointment.doctor?.name}</p>
          <p><strong>Specialty:</strong> {appointment.doctor?.doctor_profile?.[0]?.specialty || "General"}</p>
          <p><strong>Date:</strong> {new Date(appointment.appointment_date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> {appointment.appointment_time}</p>
          <p className="fee"><strong>Consultation Fee:</strong> ₹{appointment.doctor?.doctor_profile?.[0]?.consultation_fee || "-"}</p>
        </div>
        <div className="payment-buttons">
          <button onClick={payWithEsewa} disabled={processing} className="pay-button esewa">
            {processing ? 'Processing...' : 'Pay with eSewa'}
          </button>
          <button onClick={payWithKhalti} disabled={processing} className="pay-button khalti">
            {processing ? 'Processing...' : 'Pay with Khalti'}
          </button>
        </div>

        {/* Hidden eSewa form */}
        <form ref={esewaFormRef} action="https://esewa.com.np/epay/main" method="POST" style={{ display: 'none' }}>
          <input name="amt" type="hidden" />
          <input name="psc" type="hidden" />
          <input name="pdc" type="hidden" />
          <input name="txAmt" type="hidden" />
          <input name="tAmt" type="hidden" />
          <input name="pid" type="hidden" />
          <input name="scd" type="hidden" />
          <input name="su" type="hidden" />
          <input name="fu" type="hidden" />
          <input name="spn" type="hidden" />
          <input name="sfn" type="hidden" />
          <input name="sig" type="hidden" />
        </form>
      </div>
    </div>
  );
};

export default Payment;
