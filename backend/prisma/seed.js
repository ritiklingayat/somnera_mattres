import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Somnera Mattress database...');

  // 1. Seed Admin User
  const adminPassword = await bcrypt.hash('admin', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@somnera.com' },
    update: {
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      isVerified: true,
    },
    create: {
      id: 'admin',
      firstName: 'Somnera',
      lastName: 'Admin',
      email: 'admin@somnera.com',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      isVerified: true,
    },
  });
  console.log('Admin user seeded:', admin.email);

  // 2. Seed Categories & Subcategories
  const catMattresses = await prisma.category.upsert({
    where: { name: 'Mattresses' },
    update: {},
    create: {
      id: 'cat-mattresses',
      name: 'Mattresses',
      categoryName: 'Mattresses',
      slug: 'mattresses',
      description: 'Handcrafted luxury mattresses engineered for spinal support and deep sleep.',
      subcategories: {
        create: [
          {
            id: 'sub-somnera-mattresses',
            name: 'Somnera Mattresses',
            subCategoryName: 'Somnera Mattresses',
            slug: 'somnera-mattresses',
          },
        ],
      },
    },
    include: { subcategories: true },
  });

  const catEssentials = await prisma.category.upsert({
    where: { name: 'Sleep Essentials' },
    update: {},
    create: {
      id: 'cat-sleep-essentials',
      name: 'Sleep Essentials',
      categoryName: 'Sleep Essentials',
      slug: 'sleep-essentials',
      description: 'Curated pillows, protectors, and accessories for the perfect sleep sanctuary.',
      subcategories: {
        create: [
          {
            id: 'sub-pillows',
            name: 'Pillows',
            subCategoryName: 'Pillows',
            slug: 'pillows',
          },
          {
            id: 'sub-mattress-protectors',
            name: 'Mattress Protectors',
            subCategoryName: 'Mattress Protectors',
            slug: 'mattress-protectors',
          },
        ],
      },
    },
    include: { subcategories: true },
  });

  const subMattresses = catMattresses.subcategories[0]?.id;
  const subPillows = catEssentials.subcategories.find((s) => s.slug === 'pillows')?.id;
  const subProtectors = catEssentials.subcategories.find((s) => s.slug === 'mattress-protectors')?.id;

  // 3. Seed Products
  const products = [
    {
      id: 'og-ortho',
      name: 'OG-Ortho',
      productName: 'OG-Ortho',
      productSection: 'MATTRESS',
      productType: 'MATTRESS',
      brand: 'Somnera',
      sku: 'SOM-MAT-OG-ORTHO',
      eyebrow: 'Signature collection',
      image: '/product-images/og-ortho.jpeg',
      imageUrl: '/product-images/og-ortho.jpeg',
      description: 'An elevated orthopaedic sleep surface with natural latex comfort and dependable support.',
      shortDescription: 'An elevated orthopaedic sleep surface with natural latex comfort and dependable support.',
      warranty: '10 years',
      firmness: 'Medium firm',
      material: 'Natural Latex',
      materials: ['Knitted fabric', 'Natural Latex', 'HR foam', 'Orthopaedic'],
      badge: 'Most loved',
      prices: { 6: 950, 8: 1050 },
      price: 950,
      sellingPrice: 950,
      mrp: 1200,
      stock: 25,
      isActive: true,
      isFeatured: true,
      showOnHomepage: true,
      categoryId: catMattresses.id,
      subCategoryId: subMattresses,
      needs: ['Back Support', 'Latex'],
      userTypes: ['Couples', 'For Individual'],
      tech: ['Ortho Comfort'],
      feels: ['Medium Firm'],
      availableSizes: ['72x30', '72x36', '72x48', '72x60', '72x72', '75x36', '75x60', '75x72', '78x60', '78x72'],
    },
    {
      id: 'somnus',
      name: 'Somnus',
      productName: 'Somnus',
      productSection: 'MATTRESS',
      productType: 'MATTRESS',
      brand: 'Somnera',
      sku: 'SOM-MAT-SOMNUS',
      eyebrow: 'Memory comfort',
      image: '/product-images/somnus.jpeg',
      imageUrl: '/product-images/somnus.jpeg',
      description: 'Pressure-relieving memory foam comfort, balanced by a supportive orthopaedic core.',
      shortDescription: 'Pressure-relieving memory foam comfort, balanced by a supportive orthopaedic core.',
      warranty: '10 years',
      firmness: 'Medium plush',
      material: 'Memory foam',
      materials: ['Knitted fabric', 'Memory foam', 'HR foam', 'Orthopaedic'],
      badge: 'Cloud comfort',
      prices: { 6: 740, 8: 840 },
      price: 740,
      sellingPrice: 740,
      mrp: 950,
      stock: 30,
      isActive: true,
      isFeatured: true,
      showOnHomepage: true,
      categoryId: catMattresses.id,
      subCategoryId: subMattresses,
      needs: ['No Partner Disturbance', 'Cozy & Snug'],
      userTypes: ['Couples', 'Guests'],
      tech: ['Memory'],
      feels: ['Medium Soft Feel'],
      availableSizes: ['72x30', '72x36', '72x48', '72x60', '72x72', '75x36', '75x60', '75x72', '78x60', '78x72'],
    },
    {
      id: 'bodiesense',
      name: 'BodySense',
      productName: 'BodySense',
      productSection: 'MATTRESS',
      productType: 'MATTRESS',
      brand: 'Somnera',
      sku: 'SOM-MAT-BODIESENSE',
      eyebrow: 'Responsive comfort',
      image: '/product-images/bodiesense.jpeg',
      imageUrl: '/product-images/bodiesense.jpeg',
      description: 'Body-contouring memory comfort made for restorative, uninterrupted sleep.',
      shortDescription: 'Body-contouring memory comfort made for restorative, uninterrupted sleep.',
      warranty: '10 years',
      firmness: 'Balanced',
      material: 'Memory foam',
      materials: ['Knitted fabric', 'Memory foam', 'HR foam', 'Orthopaedic'],
      badge: 'Best value',
      prices: { 5: 580, 6: 680 },
      price: 580,
      sellingPrice: 580,
      mrp: 750,
      stock: 20,
      isActive: true,
      isFeatured: true,
      showOnHomepage: true,
      categoryId: catMattresses.id,
      subCategoryId: subMattresses,
      needs: ['Multi Activity', 'Cozy & Snug'],
      userTypes: ['For Individual', 'Couple With Kids'],
      tech: ['Pro Comfort'],
      feels: ['Medium Firm'],
      availableSizes: ['72x30', '72x36', '72x48', '72x60', '72x72', '75x36', '75x60', '75x72', '78x60', '78x72'],
    },
    {
      id: 'orthosense',
      name: 'OrthoSense',
      productName: 'OrthoSense',
      productSection: 'MATTRESS',
      productType: 'MATTRESS',
      brand: 'Somnera',
      sku: 'SOM-MAT-ORTHOSENSE',
      eyebrow: 'Targeted support',
      image: '/product-images/orthosense.jpeg',
      imageUrl: '/product-images/orthosense.jpeg',
      description: 'High-density orthopaedic support designed to align the spine and relieve daily stress.',
      shortDescription: 'High-density orthopaedic support designed to align the spine and relieve daily stress.',
      warranty: '10 years',
      firmness: 'Firm',
      material: 'HR foam',
      materials: ['Knitted fabric', 'HR foam', 'Orthopaedic'],
      badge: 'Spine specialist',
      prices: { 5: 480, 6: 550 },
      price: 480,
      sellingPrice: 480,
      mrp: 650,
      stock: 25,
      isActive: true,
      isFeatured: true,
      showOnHomepage: true,
      categoryId: catMattresses.id,
      subCategoryId: subMattresses,
      needs: ['Back Support', 'Extra Firmness'],
      userTypes: ['For Individual', 'Elderly'],
      tech: ['Spine Align'],
      feels: ['Firm'],
      availableSizes: ['72x30', '72x36', '72x48', '72x60', '72x72', '75x36', '75x60', '75x72', '78x60', '78x72'],
    },
    {
      id: 'aarogyam',
      name: 'Aarogyam',
      productName: 'Aarogyam',
      productSection: 'MATTRESS',
      productType: 'MATTRESS',
      brand: 'Somnera',
      sku: 'SOM-MAT-AAROGYAM',
      eyebrow: 'Natural luxury',
      image: '/product-images/aarogyam.jpeg',
      imageUrl: '/product-images/aarogyam.jpeg',
      description: 'Premium organic latex paired with breathable pin-core cooling for pure, chemical-free sleep.',
      shortDescription: 'Premium organic latex paired with breathable pin-core cooling for pure, chemical-free sleep.',
      warranty: '10 years',
      firmness: 'Medium',
      material: 'Organic Latex',
      materials: ['Organic cotton', '100% Natural Latex', 'Coir core'],
      badge: 'Pure organic',
      prices: { 6: 1200, 8: 1400 },
      price: 1200,
      sellingPrice: 1200,
      mrp: 1600,
      stock: 15,
      isActive: true,
      isFeatured: true,
      showOnHomepage: true,
      categoryId: catMattresses.id,
      subCategoryId: subMattresses,
      needs: ['Organic Living', 'Latex', 'Cooling'],
      userTypes: ['Couples', 'Wellness Conscious'],
      tech: ['Eco Pure'],
      feels: ['Medium'],
      availableSizes: ['72x30', '72x36', '72x48', '72x60', '72x72', '75x36', '75x60', '75x72', '78x60', '78x72'],
    },
    {
      id: 'dreamio',
      name: 'Dreamio',
      productName: 'Dreamio',
      productSection: 'PILLOW',
      productType: 'PILLOW',
      brand: 'Somnera',
      sku: 'SOM-PIL-DREAMIO',
      material: 'Fiber',
      materials: ['High crimped hollow fibre'],
      pillowType: 'Premium Pillow',
      shortDescription: 'A luxuriously soft, breathable premium fiber pillow with hypoallergenic filling.',
      description: 'Dreamio is filled with high crimped hollow fibre for a soft, fluffy feel, breathable comfort, and easy everyday support.',
      mrp: 799,
      sellingPrice: 569,
      price: 569,
      stock: 50,
      packSize: 1,
      image: '/product-images/dreamio-main.jpg',
      imageUrl: '/product-images/dreamio-main.jpg',
      galleryImages: ['/product-images/dreamio-gallery-1.jpg'],
      isActive: true,
      isFeatured: true,
      showOnHomepage: true,
      categoryId: catEssentials.id,
      subCategoryId: subPillows,
    },
    {
      id: 'nyadra',
      name: 'Nyadra',
      productName: 'Nyadra',
      productSection: 'PILLOW',
      productType: 'PILLOW',
      brand: 'Somnera',
      sku: 'SOM-PIL-NYADRA',
      material: 'Memory Foam',
      materials: ['Memory foam', 'breathable quilted fabric'],
      pillowType: 'Memory Foam Pillow',
      shortDescription: 'Ergonomic adaptive support with breathable fabric and pressure-relieving memory foam.',
      description: 'Nyadra combines adaptive memory foam, ergonomic support, breathable fabric, and durable construction for pressure-relieving comfort.',
      mrp: 1499,
      sellingPrice: 1099,
      price: 1099,
      stock: 35,
      packSize: 1,
      image: '/product-images/nyadra-gallery-1.jpg',
      imageUrl: '/product-images/nyadra-gallery-1.jpg',
      galleryImages: ['/product-images/nyadra-main.jpg', '/product-images/nyadra-gallery-2.jpg'],
      isActive: true,
      isFeatured: true,
      showOnHomepage: true,
      categoryId: catEssentials.id,
      subCategoryId: subPillows,
    },
    {
      id: 'shield',
      name: 'Shield',
      productName: 'Shield',
      productSection: 'PROTECTOR',
      productType: 'PROTECTOR',
      brand: 'Somnera',
      sku: 'SOM-PRO-SHIELD',
      material: 'Terry Cotton',
      materials: ['Soft terry fabric', 'waterproof breathable barrier'],
      protectorType: 'Waterproof Mattress Protector',
      shortDescription: 'An anti-bacterial, waterproof mattress protector with a breathable surface and elastic grip.',
      description: 'Shield helps guard mattresses from spills, dust, and everyday moisture with soft terry comfort, breathable protection, and an elastic grip.',
      mrp: 1299,
      sellingPrice: 899,
      price: 899,
      stock: 40,
      image: '/product-images/shield-main.jpg',
      imageUrl: '/product-images/shield-main.jpg',
      galleryImages: ['/product-images/shield-gallery-1.jpg'],
      isActive: true,
      isFeatured: true,
      showOnHomepage: false,
      availableSizes: ['Single', 'Queen', 'King'],
      categoryId: catEssentials.id,
      subCategoryId: subProtectors,
    },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({
      where: {
        OR: [
          { id: p.id },
          ...(p.sku ? [{ sku: p.sku }] : []),
        ],
      },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: p,
      });
    } else {
      await prisma.product.create({
        data: p,
      });
    }
  }
  console.log(`Seeded ${products.length} products.`);

  // 4. Seed Coupons
  const coupons = [
    {
      id: 'coupon-welcome10',
      code: 'WELCOME10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 2000,
      maxDiscount: 2000,
      active: true,
      publicVisible: true,
      expiryDate: new Date('2030-12-31T23:59:59.000Z'),
    },
    {
      id: 'coupon-somnera500',
      code: 'SOMNERA500',
      discountType: 'FLAT',
      discountValue: 500,
      minOrderAmount: 5000,
      maxDiscount: 500,
      active: true,
      publicVisible: true,
      expiryDate: new Date('2030-12-31T23:59:59.000Z'),
    },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: c,
      create: c,
    });
  }
  console.log('Seeded coupons.');

  // 5. Seed Showroom
  await prisma.showroom.upsert({
    where: { id: 'showroom-flagship-1' },
    update: {},
    create: {
      id: 'showroom-flagship-1',
      city: 'Chhatrapati Sambhajinagar',
      name: 'Somnera Flagship Experience Center - Bandra West',
      address: 'Plot 45, Turner Road, Bandra West, Mumbai, Maharashtra 400050',
      phone: '+91 98765 43210',
      hours: '10:00 AM - 9:00 PM (Open 7 Days)',
      facilities: ['Trial Zone', 'Sleep Consultant On-Site', 'Parking Available'],
      mapUrl: '',
      isActive: true,
      sortOrder: 0,
    },
  });
  console.log('Seeded showroom.');

  // 6. Seed Dynamic Promotional Offers & Banners
  const offers = [
    {
      id: 'offer-monsoon-celebration',
      title: 'Monsoon Sleep Celebration',
      subtitle: 'Enjoy extra savings on all Orthopaedic & Natural Latex mattresses. Includes 2 complimentary sleep pillows.',
      bannerImageUrl: 'https://images.unsplash.com/photo-1540518614846-7ede433c4570?auto=format&fit=crop&w=1400&q=80',
      discountPercent: 25,
      couponCode: 'WELCOME10',
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2028-12-31T23:59:59.000Z'),
      isActive: true,
      linkUrl: '#products',
    },
    {
      id: 'offer-memory-cloud',
      title: 'Memory Cloud Festive Special',
      subtitle: 'Special pricing on BodySense and Somnus memory foam mattresses with 10-year warranty guarantee.',
      bannerImageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80',
      discountPercent: 30,
      couponCode: 'SOMNERA500',
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2028-12-31T23:59:59.000Z'),
      isActive: true,
      linkUrl: '#products',
    },
    {
      id: 'offer-showroom-combo',
      title: 'Showroom Partner Combo Deal',
      subtitle: 'Buy any Queen or King size mattress and receive 2 Luxury Contour Memory Pillows free.',
      bannerImageUrl: 'https://images.unsplash.com/photo-1582582621959-48d27397dc69?auto=format&fit=crop&w=1400&q=80',
      discountPercent: 15,
      couponCode: 'WELCOME10',
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2028-12-31T23:59:59.000Z'),
      isActive: true,
      linkUrl: '#products',
    },
  ];

  for (const o of offers) {
    await prisma.offer.upsert({
      where: { id: o.id },
      update: o,
      create: o,
    });
  }
  console.log('Seeded promotional offers.');

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
