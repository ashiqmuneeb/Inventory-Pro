// import React, { useState, useEffect } from 'react';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   Typography,
//   Box,
//   TextField,
//   Button,
//   Grid,
//   Chip,
//   Pagination,
//   Tabs,
//   Tab,
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
//   IconButton,
//   Tooltip
// } from '@mui/material';
// import { DatePicker } from '@mui/x-date-pickers';
// import { 
//   Refresh, 
//   FileDownload, 
//   PictureAsPdf, 
//   InsertChart,
//   Timeline,
//   BarChart as BarChartIcon,
//   PieChart as PieChartIcon
// } from '@mui/icons-material';
// import { format, subDays, subMonths, subYears } from 'date-fns';
// import api from '../../api/api';
// import Loading from '../common/Loading';
// import {
//   BarChart,
//   Bar,
//   PieChart,
//   Pie,
//   Cell,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip as ChartTooltip,
//   Legend,
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   AreaChart,
//   Area
// } from 'recharts';

// const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// const StockReport = () => {
//   const [transactions, setTransactions] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [startDate, setStartDate] = useState(subMonths(new Date(), 1));
//   const [endDate, setEndDate] = useState(new Date());
//   const [productFilter, setProductFilter] = useState('');
//   const [variantFilter, setVariantFilter] = useState('');
//   const [products, setProducts] = useState([]);
//   const [variants, setVariants] = useState([]);
//   const [activeTab, setActiveTab] = useState('table');
//   const [chartType, setChartType] = useState('bar');
//   const [summaryData, setSummaryData] = useState([]);

//   const fetchTransactions = async () => {
//     try {
//       setLoading(true);
//       const params = {
//         page,
//         start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
//         end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
//         product: productFilter,
//         variant: variantFilter
//       };
      
//       const response = await api.get('/stock/report/', { params });
//       setTransactions(response.data.results || response.data);
//       setTotalPages(response.data.total_pages || 1);
      
//       // Calculate summary data for charts
//       if (response.data.results || response.data) {
//         const data = response.data.results || response.data;
//         const summary = data.reduce((acc, tx) => {
//           const date = format(new Date(tx.created_at), 'yyyy-MM-dd');
//           const existing = acc.find(item => item.date === date);
          
//           if (existing) {
//             if (tx.transaction_type === 'IN') {
//               existing.in += tx.quantity;
//             } else {
//               existing.out += tx.quantity;
//             }
//           } else {
//             acc.push({
//               date,
//               in: tx.transaction_type === 'IN' ? tx.quantity : 0,
//               out: tx.transaction_type === 'OUT' ? tx.quantity : 0
//             });
//           }
//           return acc;
//         }, []);
        
//         setSummaryData(summary.sort((a, b) => new Date(a.date) - new Date(b.date)));
//       }
//     } catch (error) {
//       console.error('Error fetching transactions:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchProducts = async () => {
//     try {
//       const response = await api.get('/products/');
//       setProducts(response.data.results || response.data);
//     } catch (error) {
//       console.error('Error fetching products:', error);
//     }
//   };

//   const fetchVariants = async () => {
//     try {
//       const response = await api.get('/product-variants/');
//       setVariants(response.data.results || response.data);
//     } catch (error) {
//       console.error('Error fetching variants:', error);
//     }
//   };

//   useEffect(() => {
//     fetchProducts();
//     fetchVariants();
//   }, []);

//   useEffect(() => {
//     fetchTransactions();
//   }, [page, startDate, endDate, productFilter, variantFilter]);

//   const handleFilter = () => {
//     setPage(1);
//     fetchTransactions();
//   };

//   const handleClearFilters = () => {
//     setStartDate(subMonths(new Date(), 1));
//     setEndDate(new Date());
//     setProductFilter('');
//     setVariantFilter('');
//     setPage(1);
//   };

//   const handlePageChange = (event, value) => {
//     setPage(value);
//   };

//   const handleQuickDateRange = (range) => {
//     const now = new Date();
//     switch (range) {
//       case 'week':
//         setStartDate(subDays(now, 7));
//         setEndDate(now);
//         break;
//       case 'month':
//         setStartDate(subMonths(now, 1));
//         setEndDate(now);
//         break;
//       case 'year':
//         setStartDate(subYears(now, 1));
//         setEndDate(now);
//         break;
//       default:
//         break;
//     }
//   };

//   const handleExport = (format) => {
//     // In a real implementation, this would call an API endpoint to generate the export
//     console.log(`Exporting to ${format} format`);
//     alert(`Exporting report to ${format} format`);
//   };

//   const renderChart = () => {
//     switch (chartType) {
//       case 'bar':
//         return (
//           <ResponsiveContainer width="100%" height={400}>
//             <BarChart data={summaryData}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="date" />
//               <YAxis />
//               <ChartTooltip />
//               <Legend />
//               <Bar dataKey="in" name="Stock In" fill="#4CAF50" />
//               <Bar dataKey="out" name="Stock Out" fill="#F44336" />
//             </BarChart>
//           </ResponsiveContainer>
//         );
//       case 'line':
//         return (
//           <ResponsiveContainer width="100%" height={400}>
//             <LineChart data={summaryData}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="date" />
//               <YAxis />
//               <ChartTooltip />
//               <Legend />
//               <Line type="monotone" dataKey="in" name="Stock In" stroke="#4CAF50" />
//               <Line type="monotone" dataKey="out" name="Stock Out" stroke="#F44336" />
//             </LineChart>
//           </ResponsiveContainer>
//         );
//       case 'area':
//         return (
//           <ResponsiveContainer width="100%" height={400}>
//             <AreaChart data={summaryData}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="date" />
//               <YAxis />
//               <ChartTooltip />
//               <Legend />
//               <Area type="monotone" dataKey="in" name="Stock In" stroke="#4CAF50" fill="#4CAF50" fillOpacity={0.3} />
//               <Area type="monotone" dataKey="out" name="Stock Out" stroke="#F44336" fill="#F44336" fillOpacity={0.3} />
//             </AreaChart>
//           </ResponsiveContainer>
//         );
//       case 'pie':
//         const pieData = [
//           { name: 'Stock In', value: summaryData.reduce((sum, item) => sum + item.in, 0) },
//           { name: 'Stock Out', value: summaryData.reduce((sum, item) => sum + item.out, 0) }
//         ];
        
//         return (
//           <ResponsiveContainer width="100%" height={400}>
//             <PieChart>
//               <Pie
//                 data={pieData}
//                 cx="50%"
//                 cy="50%"
//                 labelLine={false}
//                 outerRadius={120}
//                 fill="#8884d8"
//                 dataKey="value"
//                 label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
//               >
//                 {pieData.map((entry, index) => (
//                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                 ))}
//               </Pie>
//               <ChartTooltip />
//               <Legend />
//             </PieChart>
//           </ResponsiveContainer>
//         );
//       default:
//         return null;
//     }
//   };

//   return (
//     <Box sx={{ p: 3 }}>
//       <Typography variant="h4" gutterBottom>
//         Stock Transaction Report
//       </Typography>
      
//       {/* Filters */}
//       <Paper sx={{ p: 3, mb: 3 }}>
//         <Grid container spacing={2}>
//           <Grid item xs={12} md={3}>
//             <DatePicker
//               label="Start Date"
//               value={startDate}
//               onChange={(newValue) => setStartDate(newValue)}
//               renderInput={(params) => <TextField {...params} fullWidth />}
//             />
//           </Grid>
//           <Grid item xs={12} md={3}>
//             <DatePicker
//               label="End Date"
//               value={endDate}
//               onChange={(newValue) => setEndDate(newValue)}
//               renderInput={(params) => <TextField {...params} fullWidth />}
//             />
//           </Grid>
//           <Grid item xs={12} md={3}>
//             <FormControl fullWidth>
//               <InputLabel>Product</InputLabel>
//               <Select
//                 value={productFilter}
//                 onChange={(e) => setProductFilter(e.target.value)}
//                 label="Product"
//               >
//                 <MenuItem value="">All Products</MenuItem>
//                 {products.map((product) => (
//                   <MenuItem key={product.id} value={product.id}>
//                     {product.ProductName}
//                   </MenuItem>
//                 ))}
//               </Select>
//             </FormControl>
//           </Grid>
//           <Grid item xs={12} md={3}>
//             <FormControl fullWidth>
//               <InputLabel>Variant</InputLabel>
//               <Select
//                 value={variantFilter}
//                 onChange={(e) => setVariantFilter(e.target.value)}
//                 label="Variant"
//               >
//                 <MenuItem value="">All Variants</MenuItem>
//                 {variants.map((variant) => (
//                   <MenuItem key={variant.id} value={variant.id}>
//                     {variant.sku}
//                   </MenuItem>
//                 ))}
//               </Select>
//             </FormControl>
//           </Grid>
//           <Grid item xs={12}>
//             <Box sx={{ display: 'flex', gap: 2 }}>
//               <Button variant="contained" onClick={handleFilter}>
//                 Apply Filters
//               </Button>
//               <Button variant="outlined" onClick={handleClearFilters}>
//                 Clear Filters
//               </Button>
//               <Button variant="text" onClick={() => handleQuickDateRange('week')}>
//                 Last Week
//               </Button>
//               <Button variant="text" onClick={() => handleQuickDateRange('month')}>
//                 Last Month
//               </Button>
//               <Button variant="text" onClick={() => handleQuickDateRange('year')}>
//                 Last Year
//               </Button>
//               <Box sx={{ flexGrow: 1 }} />
//               <Tooltip title="Refresh">
//                 <IconButton onClick={handleFilter}>
//                   <Refresh />
//                 </IconButton>
//               </Tooltip>
//               <Tooltip title="Export to PDF">
//                 <IconButton onClick={() => handleExport('pdf')}>
//                   <PictureAsPdf />
//                 </IconButton>
//               </Tooltip>
//               <Tooltip title="Export to CSV">
//                 <IconButton onClick={() => handleExport('csv')}>
//                   <FileDownload />
//                 </IconButton>
//               </Tooltip>
//             </Box>
//           </Grid>
//         </Grid>
//       </Paper>

//       {/* Tabs */}
//       <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
//         <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
//           <Tab label="Table View" value="table" icon={<InsertChart />} />
//           <Tab label="Chart View" value="chart" icon={<Timeline />} />
//         </Tabs>
//       </Box>

//       {activeTab === 'chart' && (
//         <>
//           <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
//             <Button
//               variant={chartType === 'bar' ? 'contained' : 'outlined'}
//               startIcon={<BarChartIcon />}
//               onClick={() => setChartType('bar')}
//             >
//               Bar Chart
//             </Button>
//             <Button
//               variant={chartType === 'line' ? 'contained' : 'outlined'}
//               startIcon={<Timeline />}
//               onClick={() => setChartType('line')}
//             >
//               Line Chart
//             </Button>
//             <Button
//               variant={chartType === 'area' ? 'contained' : 'outlined'}
//               startIcon={<AreaChart />}
//               onClick={() => setChartType('area')}
//             >
//               Area Chart
//             </Button>
//             <Button
//               variant={chartType === 'pie' ? 'contained' : 'outlined'}
//               startIcon={<PieChartIcon />}
//               onClick={() => setChartType('pie')}
//             >
//               Pie Chart
//             </Button>
//           </Box>
//           <Paper sx={{ p: 3, mb: 3 }}>
//             {renderChart()}
//           </Paper>
//         </>
//       )}

//       {loading ? (
//         <Loading />
//       ) : (
//         <>
//           {activeTab === 'table' && (
//             <TableContainer component={Paper}>
//               <Table>
//                 <TableHead>
//                   <TableRow>
//                     <TableCell>Date</TableCell>
//                     <TableCell>Product</TableCell>
//                     <TableCell>SKU</TableCell>
//                     <TableCell>Type</TableCell>
//                     <TableCell>Quantity</TableCell>
//                     <TableCell>Notes</TableCell>
//                   </TableRow>
//                 </TableHead>
//                 <TableBody>
//                   {transactions.map((transaction) => (
//                     <TableRow key={transaction.id}>
//                       <TableCell>
//                         {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
//                       </TableCell>
//                       <TableCell>{transaction.product_name}</TableCell>
//                       <TableCell>{transaction.sku}</TableCell>
//                       <TableCell>
//                         <Chip
//                           label={transaction.transaction_type}
//                           color={
//                             transaction.transaction_type === 'IN'
//                               ? 'success'
//                               : 'error'
//                           }
//                         />
//                       </TableCell>
//                       <TableCell>{transaction.quantity}</TableCell>
//                       <TableCell>{transaction.notes}</TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             </TableContainer>
//           )}
//           <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
//             <Pagination
//               count={totalPages}
//               page={page}
//               onChange={handlePageChange}
//               color="primary"
//             />
//           </Box>
//         </>
//       )}
//     </Box>
//   );
// };

// export default StockReport;