import prisma from '../../config/prisma.js';
import { sendSuccess, sendError, sendPaginated } from '../../utils/apiResponse.js';

export const formatProduct = (p) => {
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    productName: p.productName || p.name,
    productSection: p.productSection || p.productType,
    productType: p.productType || p.productSection,
    brand: p.brand || 'Somnera',
    sku: p.sku,
    slug: p.slug || p.sku?.toLowerCase() || p.id,
    eyebrow: p.eyebrow,
    description: p.description,
    shortDescription: p.shortDescription || p.description,
    warranty: p.warranty,
    firmness: p.firmness,
    material: p.material,
    materials: p.materials || [],
    pillowType: p.pillowType,
    protectorType: p.protectorType,
    badge: p.badge,
    mrp: p.mrp,
    sellingPrice: p.sellingPrice,
    offerPrice: p.offerPrice,
    price: p.price ?? p.sellingPrice ?? p.offerPrice,
    prices: p.prices || {},
    stock: p.stock,
    stockQuantity: p.stockQuantity ?? p.stock,
    packSize: p.packSize || 1,
    image: p.image || p.imageUrl,
    imageUrl: p.imageUrl || p.image,
    images: p.images || p.galleryImages || [],
    galleryImages: p.galleryImages || p.images || [],
    videos: p.videos || p.galleryVideos || [],
    galleryVideos: p.galleryVideos || p.videos || [],
    needs: p.needs || [],
    userTypes: p.userTypes || [],
    tech: p.tech || [],
    feels: p.feels || [],
    availableSizes: p.availableSizes || [],
    isActive: p.isActive,
    active: p.isActive,
    isFeatured: p.isFeatured,
    featured: p.isFeatured,
    showOnHomepage: p.showOnHomepage,
    categoryId: p.categoryId,
    category: p.category?.name || null,
    categoryName: p.category?.categoryName || p.category?.name || null,
    subCategoryId: p.subCategoryId,
    subcategory: p.subCategory?.name || null,
    subCategoryName: p.subCategory?.subCategoryName || p.subCategory?.name || null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
};

export const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      subCategory,
      productSection,
      productType,
      isFeatured,
      showOnHomepage,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 50,
      activeOnly = 'true',
    } = req.query;

    const where = {};

    if (activeOnly === 'true') {
      where.isActive = true;
    }

    if (isFeatured === 'true') {
      where.isFeatured = true;
    }

    if (showOnHomepage === 'true') {
      where.showOnHomepage = true;
    }

    if (productSection) {
      where.OR = [
        { productSection: { equals: productSection, mode: 'insensitive' } },
        { productType: { equals: productSection, mode: 'insensitive' } },
      ];
    } else if (productType) {
      where.productType = { equals: productType, mode: 'insensitive' };
    }

    if (category) {
      where.OR = [
        { categoryId: category },
        { category: { name: { equals: category, mode: 'insensitive' } } },
        { category: { slug: { equals: category, mode: 'insensitive' } } },
      ];
    }

    if (subCategory) {
      where.OR = [
        { subCategoryId: subCategory },
        { subCategory: { name: { equals: subCategory, mode: 'insensitive' } } },
        { subCategory: { slug: { equals: subCategory, mode: 'insensitive' } } },
      ];
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'price-asc' || sort === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price-desc' || sort === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    } else if (sort === 'name') {
      orderBy = { name: 'asc' };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: true,
          subCategory: true,
        },
        orderBy,
        skip,
        take: limitNum,
      }),
    ]);

    const formatted = products.map(formatProduct);
    return sendPaginated(res, formatted, total, pageNum, limitNum, 'Products retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { id },
          { slug: id },
          { sku: id },
        ],
      },
      include: {
        category: true,
        subCategory: true,
      },
    });

    if (!product) {
      return sendError(res, 'Product not found.', 404);
    }

    return sendSuccess(res, formatProduct(product), 'Product details retrieved.');
  } catch (error) {
    next(error);
  }
};
