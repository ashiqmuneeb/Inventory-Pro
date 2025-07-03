import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Grid,
  CircularProgress
} from '@mui/material';
import { Add, Remove, Search, Refresh, ArrowBack } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';
import CustomAlert from '../components/common/Alert';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import api from '../api/api';
import MainLayout from '../components/layout/MainLayout';

const StockManagementPage = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('action') || 'view');
  const [productVariants, setProductVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingStock, setLoadingStock] = useState(false);
  const [alert, setAlert] = useState({
    open: false,
    severity: 'success',
    message: '',
  });
  const [stockHistory, setStockHistory] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState({
    product: '',
    variant: '',
    startDate: null,
    endDate: null,
  });
  const navigate = useNavigate();

  // Fetch product variants for dropdown
  useEffect(() => {
    const fetchProductVariants = async () => {
      try {
        setLoading(true);
        const response = await api.get('/product-variants/');
        setProductVariants(response.data?.results || response.data || []);
      } catch (error) {
        setAlert({
          open: true,
          severity: 'error',
          message: 'Failed to fetch product variants',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProductVariants();
  }, []);

  // Fetch stock history when filter changes
  useEffect(() => {
    const fetchStockHistory = async () => {
      try {
        setLoadingStock(true);
        const params = {};
        
        if (filter.product) params.product = filter.product;
        if (filter.variant) params.variant = filter.variant;
        if (filter.startDate) params.start_date = filter.startDate.toISOString().split('T')[0];
        if (filter.endDate) params.end_date = filter.endDate.toISOString().split('T')[0];
        
        const response = await api.get('/stock/report/', { params });
        setStockHistory(response.data);
      } catch (error) {
        setAlert({
          open: true,
          severity: 'error',
          message: 'Failed to fetch stock history',
        });
      } finally {
        setLoadingStock(false);
      }
    };

    if (activeTab === 'history') {
      fetchStockHistory();
    }
  }, [filter, activeTab]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    navigate(`/stock?action=${newValue}`);
  };

  const handleAddStock = async (values, { setSubmitting }) => {
    try {
      await api.post('/stock/add_stock/', {
        product_variant: values.product_variant,
        quantity: values.quantity,
        transaction_type: 'IN',
        notes: values.notes,
      });
      
      setAlert({
        open: true,
        severity: 'success',
        message: 'Stock added successfully',
      });
      
      // Refresh data
      setSelectedVariant(null);
      setDialogOpen(false);
    } catch (error) {
      setAlert({
        open: true,
        severity: 'error',
        message: error.response?.data?.detail || 'Failed to add stock',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveStock = async (values, { setSubmitting }) => {
    try {
      await api.post('/stock/remove_stock/', {
        product_variant: values.product_variant,
        quantity: values.quantity,
        transaction_type: 'OUT',
        notes: values.notes,
      });
      
      setAlert({
        open: true,
        severity: 'success',
        message: 'Stock removed successfully',
      });
      
      // Refresh data
      setSelectedVariant(null);
      setDialogOpen(false);
    } catch (error) {
      setAlert({
        open: true,
        severity: 'error',
        message: error.response?.data?.detail || 'Failed to remove stock',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
    setDialogOpen(true);
  };

  const getStockStatusColor = (quantity) => {
    if (quantity <= 0) return 'error';
    if (quantity < 10) return 'warning';
    return 'success';
  };

  const fetchProductVariants = async () => {
  try {
    setLoading(true);
    const response = await api.get('/product-variants/');
    setProductVariants(response.data?.results || response.data || []);
  } catch (error) {
    setAlert({
      open: true,
      severity: 'error',
      message: 'Failed to fetch product variants',
    });
  } finally {
    setLoading(false);
  }
};
useEffect(() => {
  fetchProductVariants();
}, []);

  return (
     <MainLayout>
    <Box sx={{ p: 3 }}>
      <CustomAlert
        open={alert.open}
        severity={alert.severity}
        message={alert.message}
        onClose={() => setAlert({ ...alert, open: false })}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4">Stock Management</Typography>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Current Stock" value="view" />
          <Tab label="Add Stock" value="add" />
          <Tab label="Remove Stock" value="remove" />
          <Tab label="Stock History" value="history" />
        </Tabs>
      </Paper>

      {activeTab === 'view' && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <TextField
              label="Search Products/Variants"
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: <Search />,
              }}
              sx={{ width: 300 }}
            />
            <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => {
                    setSelectedVariant(null);
                    fetchProductVariants(); // Call the data fetching function again
                }}
                >
                Refresh
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Variant</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell>Options</TableCell>
                    <TableCell>Current Stock</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productVariants.map((variant) => (
                    <TableRow key={variant.id}>
                      <TableCell>{variant.product?.ProductName}</TableCell>
                      <TableCell>{variant.name}</TableCell>
                      <TableCell>{variant.sku}</TableCell>
                      <TableCell>
                        {variant.options?.map((option, i) => (
                          <Chip
                            key={i}
                            label={`${option.variant_name}: ${option.option_value}`}
                            size="small"
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={variant.current_stock}
                          color={getStockStatusColor(variant.current_stock)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Add />}
                          onClick={() => {
                            setActiveTab('add');
                            handleVariantSelect(variant);
                          }}
                          sx={{ mr: 1 }}
                        >
                          Add
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<Remove />}
                          onClick={() => {
                            setActiveTab('remove');
                            handleVariantSelect(variant);
                          }}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {activeTab === 'add' && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Add Stock
          </Typography>
          <Formik
            initialValues={{
              product_variant: selectedVariant?.id || '',
              quantity: '',
              notes: '',
            }}
            validationSchema={Yup.object({
              product_variant: Yup.string().required('Required'),
              quantity: Yup.number()
                .required('Required')
                .positive('Must be positive'),
            })}
            onSubmit={handleAddStock}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              handleSubmit,
              isSubmitting,
              setFieldValue,
            }) => (
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Product Variant</InputLabel>
                      <Select
                        name="product_variant"
                        value={values.product_variant}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={
                          touched.product_variant && Boolean(errors.product_variant)
                        }
                        disabled={!!selectedVariant}
                      >
                        {productVariants.map((variant) => (
                          <MenuItem key={variant.id} value={variant.id}>
                            {variant.product?.ProductName} - {variant.sku}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
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
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Notes"
                      name="notes"
                      multiline
                      rows={3}
                      value={values.notes}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Adding...' : 'Add Stock'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            )}
          </Formik>
        </Paper>
      )}

      {activeTab === 'remove' && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Remove Stock
          </Typography>
          <Formik
            initialValues={{
              product_variant: selectedVariant?.id || '',
              quantity: '',
              notes: '',
            }}
            validationSchema={Yup.object({
              product_variant: Yup.string().required('Required'),
              quantity: Yup.number()
                .required('Required')
                .positive('Must be positive')
                .max(
                  selectedVariant?.current_stock || 0,
                  'Cannot remove more than available stock'
                ),
            })}
            onSubmit={handleRemoveStock}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              handleSubmit,
              isSubmitting,
              setFieldValue,
            }) => (
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Product Variant</InputLabel>
                      <Select
                        name="product_variant"
                        value={values.product_variant}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={
                          touched.product_variant && Boolean(errors.product_variant)
                        }
                        disabled={!!selectedVariant}
                      >
                        {productVariants.map((variant) => (
                          <MenuItem key={variant.id} value={variant.id}>
                            {variant.product?.ProductName} - {variant.sku} (Stock: {variant.current_stock})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
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
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Notes"
                      name="notes"
                      multiline
                      rows={3}
                      value={values.notes}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="error"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Removing...' : 'Remove Stock'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            )}
          </Formik>
        </Paper>
      )}

      {activeTab === 'history' && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Stock Transaction History
          </Typography>
          <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Product</InputLabel>
                  <Select
                    value={filter.product}
                    onChange={(e) => setFilter({ ...filter, product: e.target.value })}
                    label="Product"
                  >
                    <MenuItem value="">All Products</MenuItem>
                    {/* This should be populated with actual products */}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Variant</InputLabel>
                  <Select
                    value={filter.variant}
                    onChange={(e) => setFilter({ ...filter, variant: e.target.value })}
                    label="Variant"
                  >
                    <MenuItem value="">All Variants</MenuItem>
                    {productVariants.map((variant) => (
                      <MenuItem key={variant.id} value={variant.id}>
                        {variant.sku}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <DatePicker
                  selected={filter.startDate}
                  onChange={(date) => setFilter({ ...filter, startDate: date })}
                  selectsStart
                  startDate={filter.startDate}
                  endDate={filter.endDate}
                  placeholderText="Start Date"
                  className="date-picker-input"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <DatePicker
                  selected={filter.endDate}
                  onChange={(date) => setFilter({ ...filter, endDate: date })}
                  selectsEnd
                  startDate={filter.startDate}
                  endDate={filter.endDate}
                  minDate={filter.startDate}
                  placeholderText="End Date"
                  className="date-picker-input"
                />
              </Grid>
            </Grid>
          </Box>

          {loadingStock ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Variant</TableCell>
                    <TableCell>Transaction</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stockHistory.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(transaction.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>{transaction.product_name}</TableCell>
                      <TableCell>{transaction.sku}</TableCell>
                      <TableCell>
                        <Chip
                          label={transaction.transaction_type}
                          color={
                            transaction.transaction_type === 'IN' ? 'success' : 'error'
                          }
                        />
                      </TableCell>
                      <TableCell>{transaction.quantity}</TableCell>
                      <TableCell>{transaction.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      <style jsx global>{`
        .date-picker-input {
          width: 100%;
          padding: 16.5px 14px;
          border: 1px solid rgba(0, 0, 0, 0.23);
          border-radius: 4px;
          font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
        }
        .date-picker-input:hover {
          border-color: rgba(0, 0, 0, 0.87);
        }
        .date-picker-input:focus {
          outline: 2px solid #1976d2;
          outline-offset: -2px;
        }
      `}</style>
    </Box>
    </MainLayout>
  );
};

export default StockManagementPage;