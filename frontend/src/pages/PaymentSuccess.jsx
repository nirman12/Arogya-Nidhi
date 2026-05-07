import React, { useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';

const PaymentSuccess = () => {
  const { backendUrl, token } = useContext(AppContext);
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    const handleEsewaCallback = async () => {
      try {
        // Get the encoded data from query params
        const params = new URLSearchParams(search);
        const data = params.get('data');

        if (!data) {
          toast.error('Missing payment data');
          navigate('/patient-portal/appointments');
          return;
        }

        // Call backend to verify and process eSewa payment
        const response = await axios.post(
          `${backendUrl}/api/payments/esewa/success`,
          { data },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.status === 'Success') {
          toast.success('Payment successful! Your appointment is confirmed.');
          navigate('/patient-portal/appointments');
        } else {
          toast.error(response.data.message || 'Payment verification failed');
          navigate('/patient-portal/appointments');
        }
      } catch (error) {
        console.error('eSewa success handler error:', error);
        toast.error(error?.response?.data?.message || 'Payment verification failed');
        navigate('/patient-portal/appointments');
      }
    };

    if (token) {
      handleEsewaCallback();
    }
  }, [search, backendUrl, token, navigate]);

  return <div style={{ padding: 20, textAlign: 'center' }}>Processing payment confirmation...</div>;
};

export default PaymentSuccess;
