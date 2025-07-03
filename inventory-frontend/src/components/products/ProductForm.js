import React, { useState } from 'react';
import {
  Button,
  TextField,
  Box,
  Grid,
  Paper,
  Typography,
  IconButton,
  Divider,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { Add, Delete, CloudUpload } from '@mui/icons-material';
import { Formik, FieldArray, Form } from 'formik';
import * as Yup from 'yup';
import CustomAlert from '../common/Alert';
import api from '../../api/api'; 

const ProductForm = ({ initialValues, onSubmit, isEdit }) => {
  const [alert, setAlert] = useState({
    open: false,
    severity: 'success',
    message: '',
  });

  const validationSchema = Yup.object().shape({
    ProductName: Yup.string().required('Product name is required'),
    ProductCode: Yup.string().required('Product code is required'),
    HSNCode: Yup.string().nullable(),
    variants: Yup.array().of(
      Yup.object().shape({
        name: Yup.string().required('Variant name is required'),
        options: Yup.array()
          .of(Yup.object().shape({
            value: Yup.string().required('Option value is required')
          }))
          .min(1, 'At least one option is required'),
      })
    ),
  });

const [codeError, setCodeError] = useState(null);

const validateProductCode = async (code) => {
    if (!code) {
        setCodeError('Product Code is required');
        return false;
    }


    try {
        const response = await api.get(`/products/check-code/?code=${code}`);
        if (response.data.exists) {
            setCodeError('This Product Code is already in use');
            return false;
        }
        setCodeError(null);
        return true;
    } catch (error) {
        setCodeError('Error validating code');
        return false;
    }
};

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const formData = new FormData();
      
      // Append basic product fields
      formData.append('ProductName', values.ProductName);
      formData.append('ProductCode', values.ProductCode);
      formData.append('HSNCode', values.HSNCode || '');
      formData.append('IsFavourite', values.IsFavourite);
      formData.append('Active', values.Active);
      
      // Append image if it exists
      if (values.ProductImage) {
        if (values.ProductImage instanceof File) {
          formData.append('ProductImage', values.ProductImage);
        } else if (values.ProductImage?.name) {
          // Handle case where ProductImage is an object with name property
          const file = new File([], values.ProductImage.name);
          formData.append('ProductImage', file);
        }
      }
      
      // Append variants data as JSON string
      formData.append('variants', JSON.stringify(values.variants));

      await onSubmit(formData);
      setAlert({
        open: true,
        severity: 'success',
        message: isEdit ? 'Product updated successfully' : 'Product created successfully',
      });
    } catch (error) {
      setAlert({
        open: true,
        severity: 'error',
        message: error.message || 'An error occurred',
      });
      setSubmitting(false);
    }
  };

  const safeInitialValues = {
    ProductName: initialValues?.ProductName || '',
    ProductCode: initialValues?.ProductCode || '',
    HSNCode: initialValues?.HSNCode || '',
    ProductImage: initialValues?.ProductImage || null,
    IsFavourite: initialValues?.IsFavourite || false,
    Active: initialValues?.Active || true,
    variants: initialValues?.variants?.length > 0 
      ? initialValues.variants.map(variant => ({
          ...variant,
          options: variant.options?.length > 0 
            ? variant.options 
            : [{ value: '' }]
        }))
      : [{ name: '', options: [{ value: '' }] }]
  };

  return (
    <Paper sx={{ p: 3 }}>
      <CustomAlert
        open={alert.open}
        severity={alert.severity}
        message={alert.message}
        onClose={() => setAlert({ ...alert, open: false })}
      />
      <Typography variant="h6" gutterBottom>
        {isEdit ? 'Edit Product' : 'Create New Product'}
      </Typography>
      <Formik
        initialValues={safeInitialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          setFieldValue,
          isSubmitting,
        }) => (
          <Form>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Product Name"
                  name="ProductName"
                  value={values.ProductName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.ProductName && Boolean(errors.ProductName)}
                  helperText={touched.ProductName && errors.ProductName}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Product Code"
                  name="ProductCode"
                  value={values.ProductCode}
                  onChange={async (e) => {
                        handleChange(e);
                        await validateProductCode(e.target.value);
                    }}
                     onBlur={handleBlur}
                  error={touched.ProductCode && Boolean(errors.ProductCode)}
                  helperText={touched.ProductCode && errors.ProductCode}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="HSN Code"
                  name="HSNCode"
                  value={values.HSNCode}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.HSNCode && Boolean(errors.HSNCode)}
                  helperText={touched.HSNCode && errors.HSNCode}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUpload />}
                  fullWidth
                  sx={{ height: '56px' }}
                >
                  Upload Product Image
                  <input
                    type="file"
                    hidden
                    onChange={(event) => {
                      setFieldValue('ProductImage', event.currentTarget.files[0]);
                    }}
                  />
                </Button>
                {values.ProductImage && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    {values.ProductImage.name || 'File selected'}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="IsFavourite"
                      checked={values.IsFavourite}
                      onChange={handleChange}
                      color="primary"
                    />
                  }
                  label="Mark as Favorite"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="Active"
                      checked={values.Active}
                      onChange={handleChange}
                      color="primary"
                    />
                  }
                  label="Active Product"
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1">Variants</Typography>
                <FieldArray name="variants">
                  {({ push, remove }) => (
                    <div>
                      {values.variants.map((variant, index) => (
                        <Box
                          key={index}
                          sx={{
                            p: 2,
                            my: 2,
                            border: '1px solid #eee',
                            borderRadius: 1,
                          }}
                        >
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={5}>
                              <TextField
                                fullWidth
                                label="Variant Name"
                                name={`variants.${index}.name`}
                                value={variant.name}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={
                                  touched.variants &&
                                  touched.variants[index]?.name &&
                                  Boolean(errors.variants?.[index]?.name)
                                }
                                helperText={
                                  touched.variants &&
                                  touched.variants[index]?.name &&
                                  errors.variants?.[index]?.name
                                }
                              />
                            </Grid>
                            <Grid item xs={12} md={5}>
                              <FieldArray name={`variants.${index}.options`}>
                                {({ push: pushOption, remove: removeOption }) => (
                                  <div>
                                    {variant.options.map((option, optionIndex) => (
                                      <Box
                                        key={optionIndex}
                                        sx={{ display: 'flex', mb: 1 }}
                                      >
                                        <TextField
                                          fullWidth
                                          label={`Option ${optionIndex + 1}`}
                                          name={`variants.${index}.options.${optionIndex}.value`}
                                          value={option.value}
                                          onChange={handleChange}
                                          onBlur={handleBlur}
                                          error={
                                            touched.variants &&
                                            touched.variants[index]?.options &&
                                            touched.variants[index]?.options[optionIndex]?.value &&
                                            Boolean(
                                              errors.variants?.[index]?.options?.[
                                                optionIndex
                                              ]?.value
                                            )
                                          }
                                          helperText={
                                            touched.variants &&
                                            touched.variants[index]?.options &&
                                            touched.variants[index]?.options[
                                              optionIndex
                                            ]?.value &&
                                            errors.variants?.[index]?.options?.[
                                              optionIndex
                                            ]?.value
                                          }
                                        />
                                        <IconButton
                                          onClick={() => removeOption(optionIndex)}
                                          color="error"
                                        >
                                          <Delete />
                                        </IconButton>
                                      </Box>
                                    ))}
                                    <Button
                                      variant="outlined"
                                      startIcon={<Add />}
                                      onClick={() => pushOption({ value: '' })}
                                    >
                                      Add Option
                                    </Button>
                                  </div>
                                )}
                              </FieldArray>
                            </Grid>
                            <Grid item xs={12} md={2}>
                              <IconButton
                                onClick={() => remove(index)}
                                color="error"
                              >
                                <Delete />
                              </IconButton>
                            </Grid>
                          </Grid>
                        </Box>
                      ))}
                      <Button
                        variant="outlined"
                        startIcon={<Add />}
                        onClick={() => push({ name: '', options: [{ value: '' }] })}
                        sx={{ mt: 2 }}
                      >
                        Add Variant
                      </Button>
                    </div>
                  )}
                </FieldArray>
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>
    </Paper>
  );
};

ProductForm.defaultProps = {
  initialValues: {
    ProductName: '',
    ProductCode: '',
    HSNCode: '',
    ProductImage: null,
    IsFavourite: false,
    Active: true,
    variants: [{ name: '', options: [{ value: '' }] }],
  },
  isEdit: false,
};

export default ProductForm;