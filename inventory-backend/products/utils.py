import logging
from django.db import transaction
from .models import Products, Variant, VariantOption, ProductVariant, ProductVariantOption

logger = logging.getLogger(__name__)

def generate_product_variants(product):
    """
    Generate all possible variants for a product
    """
    variants = Variant.objects.filter(product=product).prefetch_related('options')
    if not variants.exists():
        logger.warning(f"No variants found for product {product.id}")
        return []
    
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
    
    logger.info(f"Generated {len(created_variants)} variants for product {product.id}")
    return created_variants