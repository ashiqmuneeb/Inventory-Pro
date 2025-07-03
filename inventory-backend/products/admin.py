from django.contrib import admin
from .models import Products, Variant, VariantOption, ProductVariant, ProductVariantOption, Stock

class VariantOptionInline(admin.TabularInline):
    model = VariantOption
    extra = 1

class VariantInline(admin.TabularInline):
    model = Variant
    extra = 1
    show_change_link = True
    inlines = [VariantOptionInline]

class ProductVariantOptionInline(admin.TabularInline):
    model = ProductVariantOption
    extra = 1

class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1
    show_change_link = True
    inlines = [ProductVariantOptionInline]

class StockInline(admin.TabularInline):
    model = Stock
    extra = 1

@admin.register(Products)
class ProductsAdmin(admin.ModelAdmin):
    list_display = ('ProductName', 'ProductCode', 'TotalStock', 'Active')
    search_fields = ('ProductName', 'ProductCode')
    list_filter = ('Active', 'CreatedDate')
    inlines = [VariantInline, ProductVariantInline]

@admin.register(Variant)
class VariantAdmin(admin.ModelAdmin):
    list_display = ('name', 'product')
    list_filter = ('product',)
    inlines = [VariantOptionInline]

@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ('sku', 'product', 'current_stock')
    search_fields = ('sku', 'product__ProductName')
    list_filter = ('product',)
    inlines = [ProductVariantOptionInline, StockInline]

@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ('product_variant', 'quantity', 'transaction_type', 'created_at')
    list_filter = ('transaction_type', 'created_at')
    search_fields = ('product_variant__sku', 'product_variant__product__ProductName')