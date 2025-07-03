from django.db.models import Sum, Q, F ,ExpressionWrapper
from django.db import models
from django.db.models.functions import Coalesce
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from .models import Products, Variant, VariantOption, ProductVariant, ProductVariantOption, Stock
from .serializers import (
    ProductSerializer, VariantSerializer, ProductVariantSerializer,
    StockTransactionSerializer, StockReportSerializer
)
from datetime import datetime, timedelta
import json
from .utils import generate_product_variants  
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

# Standalone function for dashboard stats
@api_view(['GET'])
def dashboard_stats(request):
    try:
        inventory_value = 0
        total_products = Products.objects.count()
        
        # First annotate with proper decimal fields
        product_variants = ProductVariant.objects.annotate(
            total_in=Coalesce(
                Sum('stocks__quantity', 
                    filter=Q(stocks__transaction_type='IN'),
                    output_field=models.DecimalField(max_digits=20, decimal_places=8)
                ),
                models.DecimalField(max_digits=20, decimal_places=8).clean(0, None)
            ),
            total_out=Coalesce(
                Sum('stocks__quantity', 
                    filter=Q(stocks__transaction_type='OUT'),
                    output_field=models.DecimalField(max_digits=20, decimal_places=8)
                ),
                models.DecimalField(max_digits=20, decimal_places=8).clean(0, None)
            )
        ).annotate(
            current_stock=ExpressionWrapper(
                F('total_in') - F('total_out'),
                output_field=models.DecimalField(max_digits=20, decimal_places=8)
            )
        )
        
        # Calculate inventory value
        for pv in product_variants:
            inventory_value += float(pv.current_stock) * 10  # Using float() to ensure proper conversion
            
        # Get counts with proper type handling
        in_stock_count = product_variants.filter(
            current_stock__gte=models.DecimalField(max_digits=20, decimal_places=8).clean(10, None)
        ).count()
        
        low_stock_count = product_variants.filter(
            current_stock__lt=models.DecimalField(max_digits=20, decimal_places=8).clean(10, None),
            current_stock__gt=models.DecimalField(max_digits=20, decimal_places=8).clean(0, None)
        ).count()
        
        out_of_stock_count = product_variants.filter(
            current_stock=models.DecimalField(max_digits=20, decimal_places=8).clean(0, None)
        ).count()
        
        # Get recent transactions
        recent_transactions = Stock.objects.select_related(
            'product_variant', 'product_variant__product'
        ).order_by('-created_at')[:5]
        
        recent_serializer = StockReportSerializer(recent_transactions, many=True)
        
        return Response({
            'total_products': total_products,
            'inventory_value': round(inventory_value, 2),
            'low_stock_items': low_stock_count,
            'recent_transactions': recent_serializer.data,
            'stock_status': {
                'in_stock': in_stock_count,
                'low_stock': low_stock_count,
                'out_of_stock': out_of_stock_count
            }
        })
    except Exception as e:
        logger.error(f"Dashboard stats error: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Products.objects.all().order_by('-CreatedDate')
    serializer_class = ProductSerializer

    def create(self, request, *args, **kwargs):
        try:
            # Handle form data
            data = request.data.dict()
            variants_data = json.loads(data.get('variants', '[]'))
            
            product_data = {
                'ProductName': data.get('ProductName'),
                'ProductCode': data.get('ProductCode'),
                'HSNCode': data.get('HSNCode', ''),
                'IsFavourite': data.get('IsFavourite', 'false').lower() == 'true',
                'Active': data.get('Active', 'true').lower() == 'true',
                'ProductImage': request.FILES.get('ProductImage'),
                'variants': variants_data
            }
            
            serializer = self.get_serializer(data=product_data)
            serializer.is_valid(raise_exception=True)
            
            with transaction.atomic():
                product = serializer.save(CreatedUser=request.user)
                
                Variant.objects.filter(product=product).delete()

                # Create variants
                for variant_data in variants_data:
                    options_data = variant_data.pop('options', [])
                    variant = Variant.objects.create(product=product, **variant_data)
                    
                    for option_data in options_data:
                        VariantOption.objects.create(variant=variant, **option_data)
                        
                generate_product_variants(product)
            
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
        except json.JSONDecodeError:
            return Response(
                {"variants": "Invalid JSON format for variants"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

            
    @action(detail=False, methods=['get'])
    def check_code(self, request):
        code = request.query_params.get('code')
        if not code:
            return Response(
                {"error": "Code parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        exists = Products.objects.filter(ProductCode=code).exists()
        return Response({"exists": exists})

    queryset = Products.objects.all().order_by('-CreatedDate')
    serializer_class = ProductSerializer
    pagination_class = StandardResultsSetPagination
    
    def perform_create(self, serializer):
        serializer.save(CreatedUser=self.request.user)
    
    @action(detail=True, methods=['post'])
    def generate_variants(self, request, pk=None):
        product = self.get_object()
        
        variants = Variant.objects.filter(product=product).prefetch_related('options')
        if not variants.exists():
            return Response(
                {"detail": "No variants found for this product."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = Products.objects.all().prefetch_related(
            'variants',
            'variants__options',
            'product_variants',
            'product_variants__options'
                ).order_by('-CreatedDate')
        
        from itertools import product as itertools_product
        
        options_per_variant = []
        for variant in variants:
            options = [opt.value for opt in variant.options.all()]
            options_per_variant.append(options)
        
        combinations = list(itertools_product(*options_per_variant))
        
        created_variants = []
        with transaction.atomic():
            for combo in combinations:
                sku_parts = [product.ProductCode]
                variant_options = []
                
                for variant, option_value in zip(variants, combo):
                    sku_parts.append(option_value)
                    variant_option = VariantOption.objects.get(variant=variant, value=option_value)
                    variant_options.append((variant, variant_option))
                
                sku = '-'.join(sku_parts)
                
                product_variant = ProductVariant.objects.create(
                    product=product,
                    sku=sku
                )
                
                for variant, variant_option in variant_options:
                    ProductVariantOption.objects.create(
                        product_variant=product_variant,
                        variant=variant,
                        variant_option=variant_option
                    )
                
                created_variants.append(product_variant)
        
        serializer = ProductVariantSerializer(created_variants, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class ProductVariantViewSet(viewsets.ModelViewSet):
    queryset = ProductVariant.objects.all()
    serializer_class = ProductVariantSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        product_id = self.request.query_params.get('product_id')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset
    
def create(self, request, *args, **kwargs):
    # Ensure product exists
    product_id = request.data.get('product')
    if not product_id:
        return Response(
            {"product": "This field is required."},
            status=status.HTTP_400_BAD_REQUEST
        )
        
    try:
        product = Products.objects.get(id=product_id)
    except Products.DoesNotExist:
        return Response(
            {"product": "Invalid product ID."},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = self.get_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    with transaction.atomic():
        product_variant = serializer.save()
        
        # Handle options if provided
        options_data = request.data.get('options', [])
        for option_data in options_data:
            # Find or create variant and option
            variant_name = option_data.get('name', '')
            option_value = option_data.get('value', variant_name)  # Fallback to variant_name if value not provided
            
            variant, _ = Variant.objects.get_or_create(
                product=product_variant.product,
                name=variant_name
            )
            
            variant_option, _ = VariantOption.objects.get_or_create(
                variant=variant,
                value=option_value
            )
            
            ProductVariantOption.objects.create(
                product_variant=product_variant,
                variant=variant,
                variant_option=variant_option
            )
    
    return Response(serializer.data, status=status.HTTP_201_CREATED)

class StockViewSet(viewsets.GenericViewSet):
    queryset = Stock.objects.all()
    serializer_class = StockTransactionSerializer
    
    @action(detail=False, methods=['post'])
    def add_stock(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            with transaction.atomic():
                stock = serializer.save()
                
                product = stock.product_variant.product
                product.TotalStock = (product.TotalStock or 0) + stock.quantity
                product.save()
                
                logger.info(f"Stock added: {stock.quantity} for variant {stock.product_variant.sku}")
                
                return Response(
                    {"detail": "Stock added successfully."},
                    status=status.HTTP_201_CREATED
                )
        except Exception as e:
            logger.error(f"Error adding stock: {str(e)}")
            return Response(
                {"detail": "Error adding stock."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def remove_stock(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        product_variant = data['product_variant']
        quantity = data['quantity']
        
        current_stock = product_variant.current_stock
        if current_stock < quantity:
            return Response(
                {"detail": "Insufficient stock available."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                stock = Stock.objects.create(
                    product_variant=product_variant,
                    quantity=quantity,
                    transaction_type='OUT',
                    notes=data.get('notes')
                )
                
                product = product_variant.product
                product.TotalStock = (product.TotalStock or 0) - quantity
                product.save()
                
                logger.info(f"Stock removed: {stock.quantity} for variant {stock.product_variant.sku}")
                
                return Response(
                    {"detail": "Stock removed successfully."},
                    status=status.HTTP_201_CREATED
                )
        except Exception as e:
            logger.error(f"Error removing stock: {str(e)}")
            return Response(
                {"detail": "Error removing stock."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def report(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        queryset = self.queryset
        
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__gte=start_date)
            except ValueError:
                return Response(
                    {"detail": "Invalid start_date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date() + timedelta(days=1)
                queryset = queryset.filter(created_at__date__lt=end_date)
            except ValueError:
                return Response(
                    {"detail": "Invalid end_date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        serializer = StockReportSerializer(queryset.order_by('-created_at'), many=True)
        return Response(serializer.data)