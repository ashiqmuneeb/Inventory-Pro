import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import { 
  Add, 
  Inventory, 
  Assessment, 
  Warning, 
  ArrowUpward, 
  ArrowDownward,
  Refresh,
  TrendingUp,
  ShowChart,
  Storage,
  LocalShipping
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import api from '../api/api';
import PageHeader from '../components/common/PageHeader';
import CustomAlert from '../components/common/Alert';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import Navbar from '../components/layout/Navbar';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [stats, setStats] = useState({
    total_products: 0,
    inventory_value: 0,
    low_stock_items: 0,
    recent_transactions: [],
    stock_status: {
      in_stock: 0,
      low_stock: 0,
      out_of_stock: 0
    },
    stock_trends: [],
    category_distribution: [],
    inventory_value_history: []
  });
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'error' });
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('week');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/stock/dashboard_stats/?time_range=${timeRange}`);
      setStats(response.data);
    } catch (error) {
      setAlert({
        open: true,
        message: 'Failed to load dashboard data',
        severity: 'error'
      });
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const StatCard = ({ icon, title, value, color, trend, trendValue, subtitle }) => (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      borderLeft: `4px solid ${theme.palette[color].main}`,
      boxShadow: theme.shadows[2],
      transition: 'transform 0.3s, box-shadow 0.3s',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: theme.shadows[4]
      }
    }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="center" mb={1}>
          <Box
            sx={{
              backgroundColor: theme.palette[color].light,
              color: theme.palette[color].main,
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography 
              variant="subtitle2" 
              color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h4" 
              color="text.primary"
              sx={{ fontWeight: 600 }}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
          </Box>
        </Box>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        {trend && (
          <Box display="flex" alignItems="center" mt={1}>
            {trend === 'up' ? (
              <ArrowUpward color="success" fontSize="small" />
            ) : (
              <ArrowDownward color="error" fontSize="small" />
            )}
            <Typography 
              variant="body2" 
              color={trend === 'up' ? 'success.main' : 'error.main'}
              ml={0.5}
              sx={{ fontWeight: 500 }}
            >
              {trendValue}% from last {timeRange}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const totalStockItems = stats.stock_status.in_stock + stats.stock_status.low_stock + stats.stock_status.out_of_stock;
  const inStockPercentage = totalStockItems > 0 ? 
    (stats.stock_status.in_stock / totalStockItems) * 100 : 0;
  const lowStockPercentage = totalStockItems > 0 ? 
    (stats.stock_status.low_stock / totalStockItems) * 100 : 0;
  const outOfStockPercentage = totalStockItems > 0 ? 
    (stats.stock_status.out_of_stock / totalStockItems) * 100 : 0;

  const stockStatusData = [
    { name: 'In Stock', value: stats.stock_status.in_stock, color: '#4CAF50' },
    { name: 'Low Stock', value: stats.stock_status.low_stock, color: '#FFC107' },
    { name: 'Out of Stock', value: stats.stock_status.out_of_stock, color: '#F44336' }
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Navbar />
      <Box component="main" sx={{ p: 3, pt: 10 }}>
        <PageHeader 
          title="Inventory Dashboard" 
          breadcrumbs={[
            { label: 'Home', path: '/' }
          ]}
          action={
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant={timeRange === 'week' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setTimeRange('week')}
              >
                Week
              </Button>
              <Button
                variant={timeRange === 'month' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setTimeRange('month')}
              >
                Month
              </Button>
              <Button
                variant={timeRange === 'year' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setTimeRange('year')}
              >
                Year
              </Button>
              
              <Tooltip title="Refresh data">
                <IconButton
                  onClick={handleRefresh}
                  disabled={refreshing}
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.paper
                  }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          }
        />

        <CustomAlert 
          open={alert.open} 
          message={alert.message} 
          severity={alert.severity}
          onClose={() => setAlert({...alert, open: false})}
        />

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <CircularProgress size={60} />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Stats Cards */}
            <Grid item xs={12} md={4}>
              <StatCard
                icon={<Inventory fontSize="small" />}
                title="Total Products"
                value={stats.total_products}
                color="primary"
                trend="up"
                trendValue={5.2}
                subtitle="Across all categories"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard
                icon={<Assessment fontSize="small" />}
                title="Inventory Value"
                value={`$${stats.inventory_value.toLocaleString()}`}
                color="info"
                trend="down"
                trendValue={2.4}
                subtitle="Current total value"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard
                icon={<Warning fontSize="small" />}
                title="Low Stock Items"
                value={stats.low_stock_items}
                color="warning"
                trend="up"
                trendValue={10.5}
                subtitle="Needs restocking"
              />
            </Grid>

            {/* Inventory Value Trend */}
            <Grid item xs={12} lg={8}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Inventory Value Trend
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={stats.inventory_value_history}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <ChartTooltip 
                          formatter={(value) => [`$${value.toLocaleString()}`, 'Inventory Value']}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                          name="Inventory Value"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Stock Status */}
            <Grid item xs={12} lg={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Stock Status Distribution
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stockStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {stockStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip 
                          formatter={(value, name, props) => [
                            value, 
                            `${name} (${((props.payload.percent || 0) * 100).toFixed(1)}%)`
                          ]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Stock Movements */}
            <Grid item xs={12} lg={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Recent Stock Movements
                    </Typography>
                    <Button 
                      size="small" 
                      component={Link}
                      to="/stock"
                      endIcon={<TrendingUp />}
                      sx={{ textTransform: 'none' }}
                    >
                      View All Transactions
                    </Button>
                  </Box>
                  <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                          <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>Quantity</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stats.recent_transactions.map((tx) => (
                          <TableRow 
                            key={tx.id}
                            hover
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                          >
                            <TableCell>
                              <Typography variant="body2">
                                {format(new Date(tx.created_at), 'MMM dd')}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {format(new Date(tx.created_at), 'HH:mm')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontWeight: 500 }}>
                                {tx.product_name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {tx.sku}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box 
                                component="span" 
                                sx={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  color: tx.transaction_type === 'IN' ? 
                                    theme.palette.success.main : 
                                    theme.palette.error.main,
                                  fontWeight: 500
                                }}
                              >
                                {tx.transaction_type === 'IN' ? (
                                  <ArrowUpward fontSize="small" sx={{ mr: 0.5 }} />
                                ) : (
                                  <ArrowDownward fontSize="small" sx={{ mr: 0.5 }} />
                                )}
                                {tx.transaction_type === 'IN' ? 'Stock In' : 'Stock Out'}
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Typography 
                                sx={{ 
                                  fontWeight: 600,
                                  color: tx.transaction_type === 'IN' ? 
                                    theme.palette.success.main : 
                                    theme.palette.error.main
                                }}
                              >
                                {tx.transaction_type === 'IN' ? '+' : '-'}{tx.quantity}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Category Distribution */}
            <Grid item xs={12} lg={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Category Distribution
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats.category_distribution}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <ChartTooltip 
                          formatter={(value) => [value, 'Products']}
                        />
                        <Legend />
                        <Bar dataKey="value" name="Products" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12} lg={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Quick Actions
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        component={Link}
                        to="/stock/add"
                        startIcon={<Add />}
                        sx={{ py: 1.5 }}
                      >
                        Add Stock
                      </Button>
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        color="secondary"
                        fullWidth
                        component={Link}
                        to="/products"
                        startIcon={<Inventory />}
                        sx={{ py: 1.5 }}
                      >
                        Manage Products
                      </Button>
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        color="warning"
                        fullWidth
                        component={Link}
                        to="/products?low_stock=true"
                        startIcon={<Warning />}
                        sx={{ py: 1.5 }}
                      >
                        Low Stock Alert
                      </Button>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Stock Status
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2">
                        <Box component="span" sx={{ color: 'success.main', fontWeight: 500 }}>
                          In Stock
                        </Box> ({stats.stock_status.in_stock})
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {Math.round(inStockPercentage)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={inStockPercentage} 
                      color="success" 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2">
                        <Box component="span" sx={{ color: 'warning.main', fontWeight: 500 }}>
                          Low Stock
                        </Box> ({stats.stock_status.low_stock})
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {Math.round(lowStockPercentage)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={lowStockPercentage} 
                      color="warning" 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Box>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2">
                        <Box component="span" sx={{ color: 'error.main', fontWeight: 500 }}>
                          Out of Stock
                        </Box> ({stats.stock_status.out_of_stock})
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {Math.round(outOfStockPercentage)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={outOfStockPercentage} 
                      color="error" 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;