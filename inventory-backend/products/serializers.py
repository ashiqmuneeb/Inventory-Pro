from rest_framework import serializers
from .models import Products, Variant, VariantOption, ProductVariant, ProductVariantOption, Stock
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class VariantOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = VariantOption
        fields = ['id', 'value']

class VariantSerializer(serializers.ModelSerializer):
    options = VariantOptionSerializer(many=True)
    
    class Meta:
        model = Variant
        fields = ['id', 'name', 'options']

class ProductVariantOptionSerializer(serializers.ModelSerializer):
    variant_name = serializers.CharField(source='variant.name', read_only=True)
    option_value = serializers.CharField(source='variant_option.value', read_only=True)
    
    class Meta:
        model = ProductVariantOption
        fields = ['id', 'variant_name', 'option_value']

class ProductVariantSerializer(serializers.ModelSerializer):
    options = ProductVariantOptionSerializer(many=True, read_only=True)
    current_stock = serializers.DecimalField(max_digits=20, decimal_places=8, read_only=True)
    product_name = serializers.CharField(source='product.ProductName', read_only=True)
    
    class Meta:
        model = ProductVariant
        fields = ['id', 'product', 'sku', 'options', 'current_stock', 'product_name']
        extra_kwargs = {
            'product': {'required': True},
            'sku': {'required': True}
        }

    def validate(self, data):
        if 'product' not in data:
            raise serializers.ValidationError("Product is required")
        return data

    def create(self, validated_data):
        options_data = validated_data.pop('options', [])
        product_variant = ProductVariant.objects.create(**validated_data)
        
        for option_data in options_data:
            # Create or get variant
            variant_data = option_data['variant']
            variant, _ = Variant.objects.get_or_create(
                product=variant_data['product'],
                name=variant_data['name']
            )
            
            # Create or get variant option
            variant_option_data = option_data['variant_option']
            variant_option, _ = VariantOption.objects.get_or_create(
                variant=variant,
                value=variant_option_data['value']
            )
            
            # Create product variant option
            ProductVariantOption.objects.create(
                product_variant=product_variant,
                variant=variant,
                variant_option=variant_option
            )
        
        return product_variant

class StockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stock
        fields = ['id', 'quantity', 'transaction_type', 'notes', 'created_at']

class ProductSerializer(serializers.ModelSerializer):
    variants = VariantSerializer(many=True, required=False)
    product_variants = ProductVariantSerializer(many=True, read_only=True)

    class Meta:
        model = Products
        fields = [
            'id', 'ProductID', 'ProductCode', 'ProductName', 'ProductImage',
            'CreatedDate', 'UpdatedDate', 'CreatedUser', 'IsFavourite', 'Active',
            'HSNCode', 'TotalStock', 'variants', 'product_variants'
        ]
        read_only_fields = ['CreatedUser', 'CreatedDate', 'UpdatedDate', 'TotalStock', 'ProductID']

    def validate_ProductCode(self, value):
        if Products.objects.filter(ProductCode=value).exists():
            raise serializers.ValidationError("ProductCode must be unique.")
        return value

    def create(self, validated_data):
        variants_data = validated_data.pop('variants', [])
        product = Products.objects.create(**validated_data)

        for variant_data in variants_data:
            options_data = variant_data.pop('options')
            variant = Variant.objects.create(product=product, **variant_data)

            for option_data in options_data:
                VariantOption.objects.create(variant=variant, **option_data)

        return product

class StockTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stock
        fields = ['product_variant', 'quantity', 'transaction_type', 'notes']
    
    def validate(self, data):
        if data['quantity'] <= 0:
            raise serializers.ValidationError("Quantity must be greater than zero.")
        return data

class StockReportSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product_variant.product.ProductName', read_only=True)
    sku = serializers.CharField(source='product_variant.sku', read_only=True)
    
    class Meta:
        model = Stock
        fields = [
            'id', 'product_name', 'sku', 'quantity', 
            'transaction_type', 'notes', 'created_at'
        ]