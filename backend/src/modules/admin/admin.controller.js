import prisma from '../../config/prisma.js';
import { cloudinaryService } from '../../services/cloudinary.service.js';
import { formatProduct } from '../products/product.controller.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';

/*
==================================================
1. OVERVIEW / METRICS
==================================================
*/
export const getAdminOverview = async (req, res, next) => {
  try {
    const [
      totalOrders,
      paidOrders,
      totalProducts,
      totalCustomers,
      recentOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.findMany({
        where: { paymentStatus: 'PAID' },
        select: { totalAmount: true },
      }),
      prisma.product.count(),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      }),
    ]);

    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    return sendSuccess(res, {
      totalRevenue,
      totalOrders,
      totalProducts,
      totalCustomers,
      recentOrders,
    }, 'Admin dashboard metrics.');
  } catch (error) {
    next(error);
  }
};

/*
==================================================
2. CATEGORY MANAGEMENT
==================================================
*/
export const getAdminCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        subcategories: true,
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      categoryName: cat.categoryName || cat.name,
      slug: cat.slug,
      description: cat.description,
      imageUrl: cat.imageUrl,
      image: cat.imageUrl,
      isActive: cat.isActive,
      productCount: cat._count.products,
      subcategories: cat.subcategories.map((s) => s.name),
      subCategories: cat.subcategories.map((s) => ({
        id: s.id,
        name: s.name,
        subCategoryName: s.subCategoryName || s.name,
        slug: s.slug,
      })),
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));

    return sendSuccess(res, formatted, 'Admin categories retrieved.');
  } catch (error) {
    next(error);
  }
};

const parseSubcategoriesInput = (subcategories) => {
  if (!subcategories) return [];
  if (Array.isArray(subcategories)) return subcategories;
  if (typeof subcategories === 'string') {
    try {
      const parsed = JSON.parse(subcategories);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'string') return [parsed];
    } catch {
      return subcategories.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
};

export const createAdminCategory = async (req, res, next) => {
  try {
    const { name, description = '', subcategories = [], isActive, imageUrl: rawUrl } = req.body;
    if (!name || !name.trim()) {
      return sendError(res, 'Category name is required.', 400);
    }

    let imageUrl = rawUrl || null;
    if (req.file) {
      const uploadResult = await cloudinaryService.uploadBuffer(req.file.buffer, {
        folder: 'somnera/categories',
      });
      imageUrl = uploadResult.secure_url || uploadResult.url;
    }

    const cleanName = name.trim();
    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const parsedSubcategories = parseSubcategoriesInput(subcategories);
    const subcategoryData = parsedSubcategories.map((sub) => {
      const subName = typeof sub === 'string' ? sub.trim() : (sub.name || sub.subCategoryName || '').trim();
      return {
        name: subName,
        subCategoryName: subName,
        slug: subName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      };
    }).filter((s) => Boolean(s.name));

    const category = await prisma.category.create({
      data: {
        name: cleanName,
        categoryName: cleanName,
        slug,
        description,
        imageUrl,
        isActive: isActive !== 'false' && isActive !== false,
        subcategories: {
          create: subcategoryData,
        },
      },
      include: { subcategories: true },
    });

    const formatted = {
      id: category.id,
      name: category.name,
      categoryName: category.categoryName || category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      image: category.imageUrl,
      isActive: category.isActive,
      subcategories: (category.subcategories || []).map((s) => s.name),
      subCategories: (category.subcategories || []).map((s) => ({
        id: s.id,
        name: s.name,
        subCategoryName: s.subCategoryName || s.name,
        slug: s.slug,
      })),
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };

    return sendSuccess(res, formatted, 'Category created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const updateAdminCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, subcategories, isActive, imageUrl: rawUrl } = req.body;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Category not found.', 404);
    }

    const updateData = {};
    if (name) {
      updateData.name = name.trim();
      updateData.categoryName = name.trim();
      updateData.slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    if (description !== undefined) {
      updateData.description = description;
    }
    if (isActive !== undefined) {
      updateData.isActive = isActive !== 'false' && isActive !== false;
    }

    let imageUrl = rawUrl;
    if (req.file) {
      const uploadResult = await cloudinaryService.uploadBuffer(req.file.buffer, {
        folder: 'somnera/categories',
      });
      imageUrl = uploadResult.secure_url || uploadResult.url;
    }
    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl;
    }

    if (subcategories !== undefined) {
      const parsedSubcategories = parseSubcategoriesInput(subcategories);
      // Re-sync subcategories: remove previous, add new
      await prisma.subcategory.deleteMany({ where: { categoryId: id } });
      const subcategoryData = parsedSubcategories.map((sub) => {
        const subName = typeof sub === 'string' ? sub.trim() : (sub.name || sub.subCategoryName || '').trim();
        return {
          name: subName,
          subCategoryName: subName,
          slug: subName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        };
      }).filter((s) => Boolean(s.name));

      updateData.subcategories = {
        create: subcategoryData,
      };
    }

    const updated = await prisma.category.update({
      where: { id },
      data: updateData,
      include: { subcategories: true },
    });

    const formatted = {
      id: updated.id,
      name: updated.name,
      categoryName: updated.categoryName || updated.name,
      slug: updated.slug,
      description: updated.description,
      imageUrl: updated.imageUrl,
      image: updated.imageUrl,
      isActive: updated.isActive,
      subcategories: (updated.subcategories || []).map((s) => s.name),
      subCategories: (updated.subcategories || []).map((s) => ({
        id: s.id,
        name: s.name,
        subCategoryName: s.subCategoryName || s.name,
        slug: s.slug,
      })),
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };

    return sendSuccess(res, formatted, 'Category updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const deleteAdminCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({ where: { id } });
    return sendSuccess(res, { success: true }, 'Category deleted successfully.');
  } catch (error) {
    next(error);
  }
};

/*
==================================================
3. PRODUCT MANAGEMENT & CLOUDINARY MULTI-IMAGE UPLOAD
==================================================
*/
export const getAdminProducts = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        subCategory: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, products.map(formatProduct), 'All products for admin.');
  } catch (error) {
    next(error);
  }
};

export const createAdminProduct = async (req, res, next) => {
  try {
    const body = req.body;
    const files = req.files || {};

    if (!body.name) {
      return sendError(res, 'Product name is required.', 400);
    }

    let mainImageUrl = body.image || body.imageUrl || '';

    // Handle primary image upload to Cloudinary
    if (files.image && files.image[0]) {
      const uploadResult = await cloudinaryService.uploadBuffer(files.image[0].buffer, {
        folder: 'somnera/products',
      });
      mainImageUrl = uploadResult.secure_url || uploadResult.url;
    }

    // Handle gallery images upload to Cloudinary
    let galleryImages = [];
    if (body.galleryImages) {
      try {
        galleryImages = typeof body.galleryImages === 'string'
          ? JSON.parse(body.galleryImages)
          : body.galleryImages;
      } catch {
        galleryImages = Array.isArray(body.galleryImages) ? body.galleryImages : [body.galleryImages];
      }
    }

    if (files.galleryImages && files.galleryImages.length > 0) {
      const uploadedGallery = await cloudinaryService.uploadMultiple(files.galleryImages, {
        folder: 'somnera/products/gallery',
      });
      galleryImages = [...galleryImages, ...uploadedGallery.map((u) => u.secure_url || u.url)];
    }

    // Handle gallery videos upload to Cloudinary
    let galleryVideos = [];
    if (body.galleryVideos) {
      try {
        galleryVideos = typeof body.galleryVideos === 'string'
          ? JSON.parse(body.galleryVideos)
          : body.galleryVideos;
      } catch {
        galleryVideos = Array.isArray(body.galleryVideos) ? body.galleryVideos : [body.galleryVideos];
      }
    } else if (body.videos) {
      try {
        galleryVideos = typeof body.videos === 'string'
          ? JSON.parse(body.videos)
          : body.videos;
      } catch {
        galleryVideos = Array.isArray(body.videos) ? body.videos : [body.videos];
      }
    }

    if (files.galleryVideos && files.galleryVideos.length > 0) {
      const uploadedVideos = await cloudinaryService.uploadMultiple(files.galleryVideos, {
        folder: 'somnera/products/videos',
      });
      galleryVideos = [...galleryVideos, ...uploadedVideos.map((u) => u.secure_url || u.url)];
    }

    // Parse array/json fields
    const parseJsonField = (field) => {
      if (!field) return [];
      if (typeof field === 'string') {
        try { return JSON.parse(field); } catch { return field.split(',').map((s) => s.trim()).filter(Boolean); }
      }
      return field;
    };

    const prices = typeof body.prices === 'string' ? JSON.parse(body.prices || '{}') : (body.prices || {});
    if (body.price4) prices['4'] = Number(body.price4);
    if (body.price5) prices['5'] = Number(body.price5);
    if (body.price6) prices['6'] = Number(body.price6);
    if (body.price8) prices['8'] = Number(body.price8);

    const effectivePrice = body.offerPrice ? Number(body.offerPrice) : (body.sellingPrice ? Number(body.sellingPrice) : (body.price ? Number(body.price) : null));

    const product = await prisma.product.create({
      data: {
        id: body.id || `prod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: body.name.trim(),
        productName: body.name.trim(),
        productSection: body.productSection || body.productType || 'MATTRESS',
        productType: body.productType || body.productSection || 'MATTRESS',
        brand: body.brand || 'Somnera',
        sku: body.sku || `SOM-${Date.now().toString(36).toUpperCase()}`,
        slug: (body.slug || body.name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'),
        eyebrow: body.eyebrow || null,
        description: body.description || '',
        shortDescription: body.shortDescription || body.description || '',
        warranty: body.warranty || null,
        firmness: body.firmness || null,
        material: body.material || null,
        materials: parseJsonField(body.materials),
        pillowType: body.pillowType || null,
        protectorType: body.protectorType || null,
        badge: body.badge || null,
        mrp: body.mrp ? Number(body.mrp) : null,
        sellingPrice: body.sellingPrice ? Number(body.sellingPrice) : null,
        offerPrice: body.offerPrice ? Number(body.offerPrice) : null,
        price: effectivePrice,
        prices,
        stock: body.stock != null ? Number(body.stock) : 25,
        stockQuantity: body.stock != null ? Number(body.stock) : 25,
        packSize: body.packSize ? Number(body.packSize) : 1,
        image: mainImageUrl,
        imageUrl: mainImageUrl,
        images: galleryImages,
        galleryImages,
        videos: galleryVideos,
        galleryVideos,
        needs: parseJsonField(body.needs),
        userTypes: parseJsonField(body.userTypes),
        tech: parseJsonField(body.tech),
        feels: parseJsonField(body.feels),
        availableSizes: parseJsonField(body.availableSizes),
        isActive: body.isActive !== false && body.isActive !== 'false',
        isFeatured: body.isFeatured === true || body.isFeatured === 'true',
        showOnHomepage: body.showOnHomepage === true || body.showOnHomepage === 'true',
        categoryId: body.categoryId || null,
        subCategoryId: body.subCategoryId || null,
      },
      include: {
        category: true,
        subCategory: true,
      },
    });

    return sendSuccess(res, formatProduct(product), 'Product created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const updateAdminProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const files = req.files || {};

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Product not found.', 404);
    }

    let mainImageUrl = existing.image;
    if (files.image && files.image[0]) {
      const uploadResult = await cloudinaryService.uploadBuffer(files.image[0].buffer, {
        folder: 'somnera/products',
      });
      mainImageUrl = uploadResult.secure_url || uploadResult.url;
    } else if (body.image || body.imageUrl) {
      mainImageUrl = body.image || body.imageUrl;
    }

    let galleryImages = existing.galleryImages || [];
    if (body.galleryImages) {
      try {
        galleryImages = typeof body.galleryImages === 'string' ? JSON.parse(body.galleryImages) : body.galleryImages;
      } catch {
        galleryImages = Array.isArray(body.galleryImages) ? body.galleryImages : [body.galleryImages];
      }
    }

    if (files.galleryImages && files.galleryImages.length > 0) {
      const uploadedGallery = await cloudinaryService.uploadMultiple(files.galleryImages, {
        folder: 'somnera/products/gallery',
      });
      galleryImages = [...galleryImages, ...uploadedGallery.map((u) => u.secure_url || u.url)];
    }

    let galleryVideos = existing.galleryVideos || existing.videos || [];
    if (body.galleryVideos) {
      try {
        galleryVideos = typeof body.galleryVideos === 'string' ? JSON.parse(body.galleryVideos) : body.galleryVideos;
      } catch {
        galleryVideos = Array.isArray(body.galleryVideos) ? body.galleryVideos : [body.galleryVideos];
      }
    } else if (body.videos) {
      try {
        galleryVideos = typeof body.videos === 'string' ? JSON.parse(body.videos) : body.videos;
      } catch {
        galleryVideos = Array.isArray(body.videos) ? body.videos : [body.videos];
      }
    }

    if (files.galleryVideos && files.galleryVideos.length > 0) {
      const uploadedVideos = await cloudinaryService.uploadMultiple(files.galleryVideos, {
        folder: 'somnera/products/videos',
        resource_type: 'video',
      });
      galleryVideos = [...galleryVideos, ...uploadedVideos.map((u) => u.secure_url || u.url)];
    }

    const parseJsonField = (field, fallback) => {
      if (!field) return fallback;
      if (typeof field === 'string') {
        try { return JSON.parse(field); } catch { return field.split(',').map((s) => s.trim()).filter(Boolean); }
      }
      return field;
    };

    let prices = existing.prices || {};
    if (body.prices) {
      prices = typeof body.prices === 'string' ? JSON.parse(body.prices) : body.prices;
    }
    if (body.price4 !== undefined) prices['4'] = Number(body.price4);
    if (body.price5 !== undefined) prices['5'] = Number(body.price5);
    if (body.price6 !== undefined) prices['6'] = Number(body.price6);
    if (body.price8 !== undefined) prices['8'] = Number(body.price8);

    const effectivePrice = body.offerPrice !== undefined ? Number(body.offerPrice) : (body.sellingPrice !== undefined ? Number(body.sellingPrice) : (body.price !== undefined ? Number(body.price) : existing.price));

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(body.name ? { name: body.name.trim(), productName: body.name.trim() } : {}),
        ...(body.productSection ? { productSection: body.productSection, productType: body.productSection } : {}),
        ...(body.brand ? { brand: body.brand } : {}),
        ...(body.sku ? { sku: body.sku } : {}),
        ...(body.slug || body.name ? { slug: (body.slug || body.name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') } : {}),
        ...(body.eyebrow !== undefined ? { eyebrow: body.eyebrow } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.shortDescription !== undefined ? { shortDescription: body.shortDescription } : {}),
        ...(body.warranty !== undefined ? { warranty: body.warranty } : {}),
        ...(body.firmness !== undefined ? { firmness: body.firmness } : {}),
        ...(body.material !== undefined ? { material: body.material } : {}),
        ...(body.materials !== undefined ? { materials: parseJsonField(body.materials, existing.materials) } : {}),
        ...(body.pillowType !== undefined ? { pillowType: body.pillowType } : {}),
        ...(body.protectorType !== undefined ? { protectorType: body.protectorType } : {}),
        ...(body.badge !== undefined ? { badge: body.badge } : {}),
        ...(body.mrp !== undefined ? { mrp: Number(body.mrp) } : {}),
        ...(body.sellingPrice !== undefined ? { sellingPrice: Number(body.sellingPrice) } : {}),
        ...(body.offerPrice !== undefined ? { offerPrice: Number(body.offerPrice) } : {}),
        price: effectivePrice,
        prices,
        ...(body.stock !== undefined ? { stock: Number(body.stock), stockQuantity: Number(body.stock) } : {}),
        ...(body.packSize !== undefined ? { packSize: Number(body.packSize) } : {}),
        image: mainImageUrl,
        imageUrl: mainImageUrl,
        images: galleryImages,
        galleryImages,
        videos: galleryVideos,
        galleryVideos,
        ...(body.needs !== undefined ? { needs: parseJsonField(body.needs, existing.needs) } : {}),
        ...(body.userTypes !== undefined ? { userTypes: parseJsonField(body.userTypes, existing.userTypes) } : {}),
        ...(body.tech !== undefined ? { tech: parseJsonField(body.tech, existing.tech) } : {}),
        ...(body.feels !== undefined ? { feels: parseJsonField(body.feels, existing.feels) } : {}),
        ...(body.availableSizes !== undefined ? { availableSizes: parseJsonField(body.availableSizes, existing.availableSizes) } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive !== false && body.isActive !== 'false' } : {}),
        ...(body.isFeatured !== undefined ? { isFeatured: body.isFeatured === true || body.isFeatured === 'true' } : {}),
        ...(body.showOnHomepage !== undefined ? { showOnHomepage: body.showOnHomepage === true || body.showOnHomepage === 'true' } : {}),
        ...(body.categoryId !== undefined ? { categoryId: body.categoryId || null } : {}),
        ...(body.subCategoryId !== undefined ? { subCategoryId: body.subCategoryId || null } : {}),
      },
      include: {
        category: true,
        subCategory: true,
      },
    });

    return sendSuccess(res, formatProduct(updated), 'Product updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const deleteAdminProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id } });
    return sendSuccess(res, { success: true }, 'Product deleted successfully.');
  } catch (error) {
    next(error);
  }
};

/*
==================================================
4. COUPON & DISCOUNT ENGINE
==================================================
*/
export const getAdminCoupons = async (req, res, next) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, coupons, 'Admin coupons retrieved.');
  } catch (error) {
    next(error);
  }
};

export const createAdminCoupon = async (req, res, next) => {
  try {
    const {
      code,
      discountType = 'PERCENTAGE',
      discountValue,
      minOrderAmount = 0,
      maxDiscount = null,
      expiryDate = null,
      usageLimit = null,
      active = true,
      publicVisible = true,
    } = req.body;

    if (!code || discountValue == null) {
      return sendError(res, 'Coupon code and discount value are required.', 400);
    }

    const cleanCode = String(code).trim().toUpperCase();

    const existing = await prisma.coupon.findUnique({ where: { code: cleanCode } });
    if (existing) {
      return sendError(res, 'A coupon with this code already exists.', 409);
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: cleanCode,
        discountType: discountType === 'FLAT' ? 'FLAT' : 'PERCENTAGE',
        discountValue: Number(discountValue),
        minOrderAmount: Number(minOrderAmount) || 0,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        active: Boolean(active),
        publicVisible: Boolean(publicVisible),
      },
    });

    return sendSuccess(res, coupon, 'Coupon created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const updateAdminCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Coupon not found.', 404);
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: {
        ...(body.code ? { code: String(body.code).trim().toUpperCase() } : {}),
        ...(body.discountType ? { discountType: body.discountType } : {}),
        ...(body.discountValue != null ? { discountValue: Number(body.discountValue) } : {}),
        ...(body.minOrderAmount != null ? { minOrderAmount: Number(body.minOrderAmount) } : {}),
        ...(body.maxDiscount !== undefined ? { maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : null } : {}),
        ...(body.expiryDate !== undefined ? { expiryDate: body.expiryDate ? new Date(body.expiryDate) : null } : {}),
        ...(body.usageLimit !== undefined ? { usageLimit: body.usageLimit ? Number(body.usageLimit) : null } : {}),
        ...(body.active !== undefined ? { active: Boolean(body.active) } : {}),
        ...(body.publicVisible !== undefined ? { publicVisible: Boolean(body.publicVisible) } : {}),
      },
    });

    return sendSuccess(res, updated, 'Coupon updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const deleteAdminCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.coupon.delete({ where: { id } });
    return sendSuccess(res, { success: true }, 'Coupon deleted successfully.');
  } catch (error) {
    next(error);
  }
};

/*
==================================================
5. ORDER MANAGEMENT
==================================================
*/
export const getAdminOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            mobile: true,
          },
        },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, orders, 'All orders retrieved for admin.');
  } catch (error) {
    next(error);
  }
};

export const updateAdminOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus, trackingNumber, courier } = req.body;

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Order not found.', 404);
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(orderStatus ? { orderStatus } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
        ...(trackingNumber !== undefined ? { trackingNumber } : {}),
        ...(courier !== undefined ? { courier } : {}),
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        items: true,
      },
    });

    return sendSuccess(res, updated, 'Order fulfillment status updated.');
  } catch (error) {
    next(error);
  }
};

/*
==================================================
6. CUSTOMER MANAGEMENT
==================================================
*/
export const getAdminCustomers = async (req, res, next) => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: 'USER' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        mobile: true,
        status: true,
        isVerified: true,
        createdAt: true,
        orders: {
          select: {
            id: true,
            totalAmount: true,
            paymentStatus: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = customers.map((c) => {
      const orderCount = c.orders.length;
      const totalSpend = c.orders
        .filter((o) => o.paymentStatus === 'PAID')
        .reduce((sum, o) => sum + o.totalAmount, 0);

      const { orders: _orders, ...safeUser } = c;
      return {
        ...safeUser,
        orderCount,
        totalSpend,
      };
    });

    return sendSuccess(res, formatted, 'Admin customers retrieved.');
  } catch (error) {
    next(error);
  }
};

export const updateAdminCustomerStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE', 'BLOCKED'].includes(status)) {
      return sendError(res, 'Invalid customer status.', 400);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        mobile: true,
        status: true,
        isVerified: true,
        createdAt: true,
      },
    });

    return sendSuccess(res, updated, 'Customer status updated.');
  } catch (error) {
    next(error);
  }
};

/*
==================================================
7. SHOWROOMS & DISTRIBUTORS
==================================================
*/
export const getAdminShowrooms = async (req, res, next) => {
  try {
    const showrooms = await prisma.showroom.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return sendSuccess(res, showrooms, 'Showrooms retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getAdminDistributorRequests = async (req, res, next) => {
  try {
    const requests = await prisma.distributorRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const formatted = requests.map((item) => ({
      id: item.id,
      fullName: item.fullName || item.name || '',
      email: item.email || '',
      phoneNumber: item.phoneNumber || item.phone || '',
      targetLocation: item.targetLocation || item.city || '',
      investmentRange: item.investmentRange || '',
      businessExperience: item.businessExperience || item.message || '',
      company: item.company || '',
      status: item.status || 'NEW',
      createdAt: item.createdAt,
    }));
    return sendSuccess(res, formatted, 'Distributor requests retrieved.');
  } catch (error) {
    next(error);
  }
};

/*
==================================================
8. OFFERS & PROMOTIONAL BANNERS
==================================================
*/
export const getAdminOffers = async (req, res, next) => {
  try {
    const offers = await prisma.offer.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, offers, 'Admin offers and promotional banners.');
  } catch (error) {
    next(error);
  }
};

export const createAdminOffer = async (req, res, next) => {
  try {
    const {
      title,
      subtitle,
      discountPercent,
      couponCode,
      startDate,
      endDate,
      isActive,
      linkUrl,
      bannerImageUrl: rawUrl,
    } = req.body;

    if (!title || !title.trim()) {
      return sendError(res, 'Offer title is required.', 400);
    }

    let bannerImageUrl = rawUrl || '';
    if (req.file) {
      const uploadResult = await cloudinaryService.uploadBuffer(req.file.buffer, {
        folder: 'somnera/offers',
      });
      bannerImageUrl = uploadResult.secure_url || uploadResult.url;
    }

    if (!bannerImageUrl) {
      return sendError(res, 'Banner image is required (upload image file or provide bannerImageUrl).', 400);
    }

    const offer = await prisma.offer.create({
      data: {
        title: title.trim(),
        subtitle: subtitle?.trim() || null,
        bannerImageUrl,
        discountPercent: discountPercent ? parseFloat(discountPercent) : null,
        couponCode: couponCode?.trim() || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive !== 'false' && isActive !== false,
        linkUrl: linkUrl?.trim() || null,
      },
    });

    return sendSuccess(res, offer, 'Promotional offer created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const updateAdminOffer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.offer.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Offer not found.', 404);
    }

    const {
      title,
      subtitle,
      discountPercent,
      couponCode,
      startDate,
      endDate,
      isActive,
      linkUrl,
      bannerImageUrl: rawUrl,
    } = req.body;

    let bannerImageUrl = rawUrl || existing.bannerImageUrl;
    if (req.file) {
      const uploadResult = await cloudinaryService.uploadBuffer(req.file.buffer, {
        folder: 'somnera/offers',
      });
      bannerImageUrl = uploadResult.secure_url || uploadResult.url;
    }

    const updated = await prisma.offer.update({
      where: { id },
      data: {
        ...(title ? { title: title.trim() } : {}),
        ...(subtitle !== undefined ? { subtitle: subtitle?.trim() || null } : {}),
        bannerImageUrl,
        ...(discountPercent !== undefined ? { discountPercent: discountPercent ? parseFloat(discountPercent) : null } : {}),
        ...(couponCode !== undefined ? { couponCode: couponCode?.trim() || null } : {}),
        ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
        ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}),
        ...(isActive !== undefined ? { isActive: isActive !== 'false' && isActive !== false } : {}),
        ...(linkUrl !== undefined ? { linkUrl: linkUrl?.trim() || null } : {}),
      },
    });

    return sendSuccess(res, updated, 'Offer updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const deleteAdminOffer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.offer.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Offer not found.', 404);
    }

    await prisma.offer.delete({ where: { id } });
    return sendSuccess(res, null, 'Offer deleted successfully.');
  } catch (error) {
    next(error);
  }
};
