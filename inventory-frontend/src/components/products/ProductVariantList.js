import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Box,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Divider,
} from '@mui/material';
import { ArrowBack, Edit, Delete, Add, Save, Cancel } from '@mui/icons-material';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import Loading from '../common/Loading';
import CustomAlert from '../common/Alert';

const ProductVariantList = () => {
  const { id: productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({
    open: false,
    severity: 'success',
    message: '',
  });

  // Editing state
  const [editingVariant, setEditingVariant] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [variantToDelete, setVariantToDelete] = useState(null);
  const [newVariantDialogOpen, setNewVariantDialogOpen] = useState(false);
  const [newVariantData, setNewVariantData] = useState({
    name: '',
    options: [{ name: '' }],
  });

  // Fetch product and variants data
  useEffect(() => {
    const fetchData = async () => {
      if (!productId) {
        setAlert({
          open: true,
          severity: 'error',
          message: 'Product ID is missing',
        });
        navigate('/products');
        return;
      }

      try {
        setLoading(true);
        const [productResponse, variantsResponse] = await Promise.all([
          api.get(`/products/${productId}/`),
          api.get('/product-variants/', { params: { product_id: productId } }),
        ]);

        setProduct(productResponse.data);
        setVariants(variantsResponse.data?.results || variantsResponse.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setAlert({
          open: true,
          severity: 'error',
          message: error.response?.data?.detail || 'Failed to fetch product data',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId, navigate]);

  // Handle variant editing
  const handleEditClick = (variant) => {
    setEditingVariant({ ...variant });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingVariant(prev => ({ ...prev, [name]: value }));
  };

  const saveVariantChanges = async () => {
    try {
      setLoading(true);
      await api.put(`/product-variants/${editingVariant.id}/`, editingVariant);
      setVariants(variants.map(v => v.id === editingVariant.id ? editingVariant : v));
      setEditingVariant(null);
      setAlert({
        open: true,
        severity: 'success',
        message: 'Variant updated successfully',
      });
    } catch (error) {
      console.error('Error updating variant:', error);
      setAlert({
        open: true,
        severity: 'error',
        message: error.response?.data?.detail || 'Failed to update variant',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle variant deletion
  const handleDeleteClick = (variant) => {
    setVariantToDelete(variant);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteVariant = async () => {
    try {
      setLoading(true);
      await api.delete(`/product-variants/${variantToDelete.id}/`);
      setVariants(variants.filter(v => v.id !== variantToDelete.id));
      setAlert({
        open: true,
        severity: 'success',
        message: 'Variant deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting variant:', error);
      setAlert({
        open: true,
        severity: 'error',
        message: error.response?.data?.detail || 'Failed to delete variant',
      });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setVariantToDelete(null);
    }
  };

  // Handle new variant creation
  const handleNewVariantChange = (e) => {
    const { name, value } = e.target;
    setNewVariantData(prev => ({ ...prev, [name]: value }));
  };

  const handleNewOptionChange = (index, e) => {
    const { name, value } = e.target;
    const newOptions = [...newVariantData.options];
    newOptions[index] = { ...newOptions[index], [name]: value };
    setNewVariantData(prev => ({ ...prev, options: newOptions }));
  };

  const addNewOption = () => {
    setNewVariantData(prev => ({
      ...prev,
      options: [...prev.options, { name: '' }],
    }));
  };

  const removeOption = (index) => {
    const newOptions = [...newVariantData.options];
    newOptions.splice(index, 1);
    setNewVariantData(prev => ({ ...prev, options: newOptions }));
  };

  const createNewVariant = async () => {
  try {
    setLoading(true);
    
    const variantData = {
      product: productId,  // Make sure this is included
      name: newVariantData.name,
      sku: `${product.ProductCode}-${newVariantData.name}`,
      options: newVariantData.options.map(opt => ({
        name: opt.name,
        value: opt.name
      }))
    };

    const response = await api.post('/product-variants/', variantData);
    setVariants([...variants, response.data]);
    
    setNewVariantDialogOpen(false);
    setNewVariantData({ name: '', options: [{ name: '' }] });
    
    setAlert({
      open: true,
      severity: 'success',
      message: 'Variant created successfully',
    });
  } catch (error) {
    console.error('Error creating variant:', error);
    setAlert({
      open: true,
      severity: 'error',
      message: error.response?.data?.detail || 'Failed to create variant',
    });
  } finally {
    setLoading(false);
  }
};

  if (loading) return <Loading />;

  if (!product) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Product not found</Typography>
        <Button 
          component={Link} 
          to="/products" 
          variant="contained" 
          sx={{ mt: 2 }}
        >
          Back to Products
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton component={Link} to="/products" sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5">
          Variants for {product.ProductName}
        </Typography>
      </Box>

      <CustomAlert
        open={alert.open}
        severity={alert.severity}
        message={alert.message}
        onClose={() => setAlert({ ...alert, open: false })}
      />

      <Divider sx={{ my: 2 }} />

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setNewVariantDialogOpen(true)}
        >
          Create Variant
        </Button>
      </Box>

      {/* Variants Table */}
      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Variant Name</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Options</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {variants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No variants found
                </TableCell>
              </TableRow>
            ) : (
              variants.map((variant) => (
                <TableRow key={variant.id}>
                  <TableCell>
                    {editingVariant?.id === variant.id ? (
                      <TextField
                        name="name"
                        value={editingVariant.name}
                        onChange={handleEditChange}
                        fullWidth
                        size="small"
                      />
                    ) : (
                      variant.name
                    )}
                  </TableCell>
                  <TableCell>{variant.sku}</TableCell>
                  <TableCell>
                    {variant.options?.map((option, i) => (
                      <Chip
                        key={i}
                        label={`${option.variant_name || option.name}`}
                        sx={{ mr: 1, mb: 1 }}
                        size="small"
                      />
                    ))}
                  </TableCell>
                  <TableCell>{variant.current_stock}</TableCell>
                  <TableCell>
                    {editingVariant?.id === variant.id ? (
                      <>
                        <Tooltip title="Save">
                          <IconButton onClick={saveVariantChanges} color="primary">
                            <Save />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel">
                          <IconButton
                            onClick={() => setEditingVariant(null)}
                            color="error"
                          >
                            <Cancel />
                          </IconButton>
                        </Tooltip>
                      </>
                    ) : (
                      <>
                        <Tooltip title="Edit">
                          <IconButton
                            onClick={() => handleEditClick(variant)}
                            color="primary"
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            onClick={() => handleDeleteClick(variant)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* New Variant Dialog */}
      <Dialog
        open={newVariantDialogOpen}
        onClose={() => setNewVariantDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Variant</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            name="name"
            label="Variant Name"
            fullWidth
            value={newVariantData.name}
            onChange={handleNewVariantChange}
            sx={{ mb: 2 }}
          />
          
          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
            Variant Options
          </Typography>
          
          {newVariantData.options.map((option, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                name="name"
                label="Option Name"
                fullWidth
                value={option.name}
                onChange={(e) => handleNewOptionChange(index, e)}
              />
              <IconButton onClick={() => removeOption(index)} color="error">
                <Delete />
              </IconButton>
            </Box>
          ))}
          
          <Button
            onClick={addNewOption}
            startIcon={<Add />}
            variant="outlined"
            sx={{ mt: 1 }}
          >
            Add Option
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewVariantDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={createNewVariant}
            color="primary"
            variant="contained"
            disabled={
              !newVariantData.name || 
              newVariantData.options.length === 0 ||
              newVariantData.options.some(opt => !opt.name)
            }
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete "{variantToDelete?.name}"?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={confirmDeleteVariant} 
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductVariantList;