import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const PaymentFailure = () => {
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const appointmentId = params.get('appointmentId');
    toast.error('Payment failed or cancelled.');
    // redirect back to appointments or payment page
    setTimeout(() => navigate('/patient-portal/appointments'), 1500);
  }, [search, navigate]);

  return <div style={{ padding: 20 }}>Payment failed or cancelled. Redirecting...</div>;
};

export default PaymentFailure;
