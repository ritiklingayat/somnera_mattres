import prisma from '../../config/prisma.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export const getCategories = async (req, res, next) => {
  try {
    const { activeOnly = 'true' } = req.query;
    const where = activeOnly === 'true' ? { isActive: true } : {};

    const categories = await prisma.category.findMany({
      where,
      include: {
        subcategories: {
          orderBy: { name: 'asc' },
        },
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
      subcategories: cat.subcategories.map((sub) => sub.name),
      subCategories: cat.subcategories.map((sub) => ({
        id: sub.id,
        name: sub.name,
        subCategoryName: sub.subCategoryName || sub.name,
        slug: sub.slug,
      })),
    }));

    return sendSuccess(res, formatted, 'Categories retrieved successfully.');
  } catch (error) {
    next(error);
  }
};
