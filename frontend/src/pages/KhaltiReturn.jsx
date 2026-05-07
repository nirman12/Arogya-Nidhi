import React, { useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';

const KhaltiReturn = () => {
  const { backendUrl, token } = useContext(AppContext);
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    const handleKhaltiCallback = async () => {
      try {
        const params = new URLSearchParams(search);
        const pidx = params.get('pidx');
        const status = params.get('status');

        if (!pidx) {
          toast.error('Missing payment reference');
          navigate('/patient-portal/appointments');
          return;
        }

        // Call backend to verify Khalti payment status
        const response = await axios.post(
          `${backendUrl}/api/payments/khalti/payment-status`,
          { pidx, status },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.status === 'Success') {
          toast.success('Payment successful! Your appointment is confirmed.');
          navigate('/patient-portal/appointments');
        } else {
          toast.error(response.data.message || 'Payment was not completed');
          navigate('/patient-portal/appointments');
        }
      } catch (error) {
        console.error('Khalti callback error:', error);
        toast.error(error?.response?.data?.message || 'Payment verification failed');
        navigate('/patient-portal/appointments');
      }
    };

    if (token) {
      handleKhaltiCallback();
    }
  }, [search, backendUrl, token, navigate]);

  return <div style={{ padding: 20, textAlign: 'center' }}>Processing payment confirmation...</div>;
};

export default KhaltiReturn;
