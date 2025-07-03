from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, ProductVariantViewSet, StockViewSet,dashboard_stats

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'product-variants', ProductVariantViewSet)
router.register(r'stock', StockViewSet, basename='stock')

urlpatterns = [
    path('', include(router.urls)),
    path('stock/dashboard_stats/', dashboard_stats, name='dashboard-stats'),
    path('products/check-code/', ProductViewSet.as_view({'get': 'check_code'})),
]