import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';
import api from '../../api/api';
import CustomAlert from '../common/Alert';

const StockAddForm = () => {
  const [searchParams] = useSearchParams();
  const variantId = searchParams.get('variant');
  const [variant, setVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({
    open: false,
    severity: 'success',
    message: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVariant = async () => {
      try {
        const response = await api.get(`/product-variants/${variantId}/`);
        setVariant(response.data);
      } catch (error) {
        setAlert({
          open: true,
          severity: 'error',
          message: 'Failed to fetch variant details',
        });
      } finally {
        setLoading(false);
      }
    };

    if (variantId) {
      fetchVariant();
    } else {
      setLoading(false);
    }
  }, [variantId]);

  const initialValues = {
    product_variant: variantId || '',
    quantity: '',
    transaction_type: 'IN',
    notes: '',
  };

  const validationSchema = Yup.object().shape({
    product_variant: Yup.string().required('Product variant is required'),
    quantity: Yup.number()
      .required('Quantity is required')
      .positive('Quantity must be positive'),
    transaction_type: Yup.string().required('Transaction type is required'),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      await api.post('/stock/add_stock/', values);
      setAlert({
        open: true,
        severity: 'success',
        message: 'Stock added successfully',
      });
      navigate('/stock');
    } catch (error) {
      setAlert({
        open: true,
        severity: 'error',
        message: error.message || 'Failed to add stock',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Paper sx={{ p: 3 }}>
      <CustomAlert
        open={alert.open}
        severity={alert.severity}
        message={alert.message}
        onClose={() => setAlert({ ...alert, open: false })}
      />
      <Typography variant="h6" gutterBottom>
        Add Stock
      </Typography>
      {variant && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1">
            Product: {variant.product?.ProductName}
          </Typography>
          <Typography variant="body1">
            SKU: {variant.sku}
          </Typography>
          <Typography variant="body1">
            Options:{' '}
            {variant.options.map((opt) => (
              <span key={opt.id}>
                {opt.variant_name}: {opt.option_value},{' '}
              </span>
            ))}
          </Typography>
        </Box>
      )}
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit,
          isSubmitting,
        }) => (
          <form onSubmit={handleSubmit}>
            {!variantId && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Product Variant</InputLabel>
                <Select
                  name="product_variant"
                  value={values.product_variant}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={
                    touched.product_variant && Boolean(errors.product_variant)
                  }
                >
                  {/* This should be populated with available variants */}
                  <MenuItem value="">
                    <em>Select a variant</em>
                  </MenuItem>
                </Select>
              </FormControl>
            )}
            <TextField
              fullWidth
              label="Quantity"
              name="quantity"
              type="number"
              value={values.quantity}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.quantity && Boolean(errors.quantity)}
              helperText={touched.quantity && errors.quantity}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              multiline
              rows={3}
              value={values.notes}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting}
            >
              Add Stock
            </Button>
          </form>
        )}
      </Formik>
    </Paper>
  );
};

export default StockAddForm;