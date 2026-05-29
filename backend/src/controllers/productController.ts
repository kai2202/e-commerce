import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import Product from '../models/Product';

// Helper: delete product image files from disk
const deleteProductImages = (images: string[]) => {
  images.forEach((imgUrl) => {
    // Only delete local files (not external URLs)
    if (imgUrl.includes('/uploads/products/')) {
      const filename = imgUrl.split('/uploads/products/').pop();
      if (filename) {
        const filePath = path.join(__dirname, '../../uploads/products', filename);
        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, (err) => {
            if (err) console.error(`Failed to delete image: ${filePath}`, err);
          });
        }
      }
    }
  });
};

// @desc    Fetch all products (with optional search, filtering and sorting)
// @route   GET /api/products
// @access  Public
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { search, category, brand, rating, color, size, priceRange, sort, page, limit, ids } = req.query;

    let matchQuery: any = {};

    // 0. IDs Filter (comma-separated list of MongoDB ObjectIds)
    if (ids) {
      const idArray = (ids as string).split(',').filter(Boolean);
      matchQuery._id = { $in: idArray };
    }

    // 1. Search text (matches name, description, brand)
    if (search) {
      matchQuery.$or = [
        { name: { $regex: search as string, $options: 'i' } },
        { description: { $regex: search as string, $options: 'i' } },
        { brand: { $regex: search as string, $options: 'i' } }
      ];
    }

    // 2. Category Filter
    if (category) {
      matchQuery.categoryId = category;
    }

    // 3. Brand Filter
    if (brand) {
      matchQuery.brand = brand;
    }

    // 4. Rating Filter
    if (rating) {
      matchQuery.rating = { $gte: Number(rating) };
    }

    // 5. Color Filter
    if (color) {
      matchQuery.colors = color;
    }

    // 6. Size Filter
    if (size) {
      matchQuery.sizes = size;
    }

    // 7. Price Range Filter (matches against effective price)
    if (priceRange) {
      let minPrice = 0;
      let maxPrice = Infinity;
      if (priceRange === 'under-1m') {
        maxPrice = 1000000;
      } else if (priceRange === '1m-5m') {
        minPrice = 1000000;
        maxPrice = 5000000;
      } else if (priceRange === '5m-15m') {
        minPrice = 5000000;
        maxPrice = 15000000;
      } else if (priceRange === 'over-15m') {
        minPrice = 15000000;
      }

      matchQuery.$expr = {
        $and: [
          { $gte: [ { $ifNull: [ "$discountPrice", "$originalPrice" ] }, minPrice ] },
          ...(maxPrice !== Infinity ? [ { $lte: [ { $ifNull: [ "$discountPrice", "$originalPrice" ] }, maxPrice ] } ] : [])
        ]
      };
    }

    // Build aggregation pipeline
    const pipeline: any[] = [
      { $match: matchQuery },
      {
        $addFields: {
          effectivePrice: { $ifNull: [ "$discountPrice", "$originalPrice" ] }
        }
      }
    ];

    // 8. Sorting
    let sortStage: any = { createdAt: -1 }; // default: newest first
    if (sort === 'price-asc') {
      sortStage = { effectivePrice: 1 };
    } else if (sort === 'price-desc') {
      sortStage = { effectivePrice: -1 };
    } else if (sort === 'newest') {
      sortStage = { createdAt: -1 };
    } else if (sort === 'top-seller') {
      sortStage = { salesCount: -1 };
    }

    pipeline.push({ $sort: sortStage });

    // Hybrid Pagination: Check if page or limit query parameters are provided
    if (page !== undefined || limit !== undefined) {
      const pageNum = Math.max(1, Number(page || 1));
      const limitNum = Math.max(1, Number(limit || 12));
      const skipNum = (pageNum - 1) * limitNum;

      const totalProducts = await Product.countDocuments(matchQuery);
      const pages = Math.ceil(totalProducts / limitNum);

      pipeline.push({ $skip: skipNum });
      pipeline.push({ $limit: limitNum });

      const products = await Product.aggregate(pipeline);
      res.json({
        products,
        totalProducts,
        page: pageNum,
        pages,
        limit: limitNum
      });
    } else {
      const products = await Product.aggregate(pipeline);
      res.json(products);
    }
  } catch (error) {
    console.error('getProducts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req: Request, res: Response) => {
  try {
    const product = new Product(req.body);
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      Object.assign(product, req.body);
      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a product (and its local image files)
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      // Delete associated image files from uploads/products/
      if (product.image && product.image.length > 0) {
        deleteProductImages(product.image as string[]);
      }

      await Product.deleteOne({ _id: product._id });
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all unique brands, colors, and sizes for filters
// @route   GET /api/products/filters
// @access  Public
export const getProductFilters = async (req: Request, res: Response) => {
  try {
    const brands = await Product.distinct('brand');
    const colors = await Product.distinct('colors');
    const sizes = await Product.distinct('sizes');

    res.json({
      brands: brands.filter(Boolean),
      colors: colors.filter(Boolean),
      sizes: sizes.filter(Boolean)
    });
  } catch (error) {
    console.error('getProductFilters error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

