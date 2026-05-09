import React, { useContext, useEffect, useState } from 'react';
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
  const [selectedGateway, setSelectedGateway] = useState(null);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/appointments/${appointmentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAppointment(data);
      } catch (error) {
        toast.error('Failed to fetch appointment details');
        navigate('/my-appointments');
      }
    };

    if (token && appointmentId) {
      fetchAppointment();
    }
  }, [token, appointmentId, backendUrl, navigate]);

  // Get consultation fee from the flat doctor object returned by the API
  const getAmount = () =>
    appointment?.doctor?.consultation_fee ??
    appointment?.doctor?.doctor_profile?.[0]?.consultation_fee ??
    0;

  const handleEsewaPayment = async () => {
    setProcessing(true);
    setSelectedGateway('esewa');
    try {
      const amount = getAmount();
      const { data } = await axios.post(
        `${backendUrl}/api/payments/esewa/initiate`,
        { appointmentId, amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!data.success) {
        toast.error('Failed to initiate eSewa payment');
        setProcessing(false);
        setSelectedGateway(null);
        return;
      }

      // Submit form to eSewa
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';

      Object.entries(data.payload).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      toast.error('Failed to process eSewa payment');
      console.error('eSewa error:', error);
      setProcessing(false);
      setSelectedGateway(null);
    }
  };

  const handleKhaltiPayment = async () => {
    setProcessing(true);
    setSelectedGateway('khalti');
    try {
      const amount = getAmount();
      const { data } = await axios.post(
        `${backendUrl}/api/payments/khalti/initiate`,
        { appointmentId, amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!data.success) {
        toast.error('Failed to initiate Khalti payment');
        setProcessing(false);
        setSelectedGateway(null);
        return;
      }

      window.location.href = data.payment_url;
    } catch (error) {
      toast.error('Failed to process Khalti payment');
      console.error('Khalti error:', error);
      setProcessing(false);
      setSelectedGateway(null);
    }
  };

  if (!appointment) {
    return <div className="payment-container">Loading...</div>;
  }

  const amount = getAmount();
  const doctorName = appointment.doctor?.user?.name || appointment.doctor?.name || 'Doctor';
  const specialty = appointment.doctor?.specialty || appointment.doctor?.specialization || 'General';

  return (
    <div className="payment-container">
      <div className="payment-card">
        <h2>Confirm Your Appointment &amp; Pay</h2>

        <div className="appointment-details">
          <p><strong>Doctor:</strong> {doctorName}</p>
          <p><strong>Specialty:</strong> {specialty}</p>
          <p><strong>Date &amp; Time:</strong> {new Date(appointment.scheduled_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          <p><strong>Duration:</strong> {appointment.duration_minutes || 30} minutes</p>
          <p className="fee"><strong>Consultation Fee:</strong> रु {amount}</p>
        </div>

        <div className="payment-methods">
          <div className="payment-method">
            <button
              onClick={handleEsewaPayment}
              disabled={processing}
              className={`pay-button esewa-btn${selectedGateway === 'esewa' ? ' active' : ''}`}
            >
              {processing && selectedGateway === 'esewa' ? 'Processing...' : 'Pay with eSewa'}
            </button>
          </div>

          <div className="divider">OR</div>

          <div className="payment-method">
            <button
              onClick={handleKhaltiPayment}
              disabled={processing}
              className={`pay-button khalti-btn${selectedGateway === 'khalti' ? ' active' : ''}`}
            >
              {processing && selectedGateway === 'khalti' ? 'Processing...' : 'Pay with Khalti'}
            </button>
          </div>
        </div>

        <p className="security-info">✓ Secure payment processing</p>
      </div>
    </div>
  );
};

export default Payment;
