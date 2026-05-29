import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

// Ensure the product images folder exists
const UPLOAD_DIR = path.join(__dirname, '../../uploads/products');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure storage — save to uploads/products/
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename(req, file, cb) {
    cb(null, `product-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// Check file type
function checkFileType(file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const filetypes = /jpg|jpeg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Images only!'));
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// POST /api/upload — Upload a product image
router.post('/', protect, admin, upload.single('image'), (req: Request, res: Response) => {
  if (req.file) {
    res.json({
      message: 'Upload thành công!',
      url: `http://localhost:5000/uploads/products/${req.file.filename}`,
      filename: req.file.filename,
    });
  } else {
    res.status(400).json({ message: 'Không có file nào được tải lên.' });
  }
});

// DELETE /api/upload/:filename — Delete a product image file
router.delete('/:filename', protect, admin, (req: Request, res: Response) => {
  const filename = String(req.params.filename);
  const filePath = path.join(UPLOAD_DIR, filename);

  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        res.status(500).json({ message: 'Không thể xoá file ảnh.' });
      } else {
        res.json({ message: 'Đã xoá ảnh thành công.' });
      }
    });
  } else {
    // File not found is OK — just respond success
    res.json({ message: 'File không tồn tại hoặc đã được xoá.' });
  }
});

export default router;
