from django.db import models

# Create your models here.
import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from versatileimagefield.fields import VersatileImageField

class Variant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    product = models.ForeignKey('Products', related_name='variants', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "products_variant"
        verbose_name = _("variant")
        verbose_name_plural = _("variants")
        unique_together = ('name', 'product')

    def __str__(self):
        return f"{self.product.ProductName} - {self.name}"

class VariantOption(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    variant = models.ForeignKey(Variant, related_name='options', on_delete=models.CASCADE)
    value = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "products_variant_option"
        verbose_name = _("variant option")
        verbose_name_plural = _("variant options")
        unique_together = ('variant', 'value')

    def __str__(self):
        return f"{self.variant.name}: {self.value}"

class ProductVariant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey('Products', related_name='product_variants', on_delete=models.CASCADE)
    sku = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "products_product_variant"
        verbose_name = _("product variant")
        verbose_name_plural = _("product variants")
        ordering = ['sku']

    def __str__(self):
        return f"{self.product.ProductName} - {self.sku}"

    @property
    def current_stock(self):
        total_in = sum(
            stock.quantity for stock in 
            self.stocks.filter(transaction_type='IN')
        )
        total_out = sum(
            stock.quantity for stock in 
            self.stocks.filter(transaction_type='OUT')
        )
        return total_in - total_out

class ProductVariantOption(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product_variant = models.ForeignKey(ProductVariant, related_name='options', on_delete=models.CASCADE)
    variant = models.ForeignKey(Variant, on_delete=models.CASCADE)
    variant_option = models.ForeignKey(VariantOption, on_delete=models.CASCADE)

    class Meta:
        db_table = "products_product_variant_option"
        verbose_name = _("product variant option")
        verbose_name_plural = _("product variant options")
        unique_together = ('product_variant', 'variant')

    def __str__(self):
        return f"{self.product_variant.sku} - {self.variant_option.value}"

class Stock(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product_variant = models.ForeignKey(ProductVariant, related_name='stocks', on_delete=models.CASCADE)
    quantity = models.DecimalField(default=0.00, max_digits=20, decimal_places=8)
    transaction_type = models.CharField(max_length=10, choices=[('IN', 'Stock In'), ('OUT', 'Stock Out')])
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "products_stock"
        verbose_name = _("stock")
        verbose_name_plural = _("stocks")
        ordering = ('-created_at',)

    def __str__(self):
        return f"{self.product_variant.sku} - {self.quantity} ({self.transaction_type})"

class Products(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ProductID = models.BigIntegerField(unique=True,blank=True)
    ProductCode = models.CharField(max_length=255, unique=True)
    ProductName = models.CharField(max_length=255)
    ProductImage = VersatileImageField(upload_to="uploads/", blank=True, null=True)
    CreatedDate = models.DateTimeField(auto_now_add=True)
    UpdatedDate = models.DateTimeField(blank=True, null=True)
    CreatedUser = models.ForeignKey("auth.User", related_name="user%(class)s_objects", on_delete=models.CASCADE)
    IsFavourite = models.BooleanField(default=False)
    Active = models.BooleanField(default=True)
    HSNCode = models.CharField(max_length=255, blank=True, null=True)
    TotalStock = models.DecimalField(default=0.00, max_digits=20, decimal_places=8, blank=True, null=True)

    class Meta:
        db_table = "products_product"
        verbose_name = _("product")
        verbose_name_plural = _("products")
        unique_together = (("ProductCode", "ProductID"),)
        ordering = ("-CreatedDate", "ProductID")

    def save(self, *args, **kwargs):
        if not self.ProductID:
            # Generate a ProductID if not provided
            last_product = Products.objects.order_by('-ProductID').first()
            self.ProductID = (last_product.ProductID + 1) if last_product else 1
        super().save(*args, **kwargs)
    
    
    def __str__(self):
        return self.ProductName