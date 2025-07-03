import React, { useState, useEffect } from 'react';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import ProductForm from '../components/products/ProductForm';
import ProductList from '../components/products/ProductList';
import ProductVariantList from '../components/products/ProductVariantList';
import MainLayout from '../components/layout/MainLayout';
import api from '../api/api';
import CustomAlert from '../components/common/Alert';
import Loading from '../components/common/Loading';

const ProductsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };

      let productId = id;

      if (id) {
        await api.put(`/products/${id}/`, formData, config); // ✅ use PUT when id exists
      } else {
        const response = await api.post('/products/', formData, config); // ✅ use POST only for creation
        productId = response.data.id;
      }

      setAlert({
        open: true,
        message: 'Product saved successfully',
        severity: 'success'
      });

      // ✅ Navigate directly to product's variant list
      setTimeout(() => navigate(`/products/${productId}/variants`), 1000);
    } catch (error) {
      console.error('Error submitting product:', error);
      setAlert({
        open: true,
        message: error.response?.data?.detail ||
                error.response?.data?.message ||
                'An error occurred while saving the product',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Wrapper to fetch data before rendering edit form
  const EditWrapper = () => {
    const { id } = useParams();
    const [initialValues, setInitialValues] = useState(null);
    const [loadingEdit, setLoadingEdit] = useState(true);

    useEffect(() => {
      const fetchProduct = async () => {
        try {
          const response = await api.get(`/products/${id}/`);
          setInitialValues(response.data);
        } catch (error) {
          console.error('Failed to load product for edit:', error);
        } finally {
          setLoadingEdit(false);
        }
      };

      fetchProduct();
    }, [id]);

    if (loadingEdit) return <Loading />;

    return (
      <ProductForm
        isEdit
        initialValues={initialValues}
        onSubmit={handleSubmit}
      />
    );
  };

  if (loading) return <MainLayout><Loading /></MainLayout>;

  return (
    <MainLayout>
      <CustomAlert
        open={alert.open}
        message={alert.message}
        severity={alert.severity}
        onClose={() => setAlert({ ...alert, open: false })}
      />
      <Routes>
        <Route path="/" element={<ProductList />} />
        <Route path="/new" element={<ProductForm onSubmit={handleSubmit} />} />
        <Route path="/:id/variants" element={<ProductVariantList />} />
      </Routes>
    </MainLayout>
  );
};

export default ProductsPage;
