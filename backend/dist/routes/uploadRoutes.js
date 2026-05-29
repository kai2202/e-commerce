"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Ensure the product images folder exists
const UPLOAD_DIR = path_1.default.join(__dirname, '../../uploads/products');
if (!fs_1.default.existsSync(UPLOAD_DIR)) {
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
}
// Configure storage — save to uploads/products/
const storage = multer_1.default.diskStorage({
    destination(req, file, cb) {
        cb(null, UPLOAD_DIR);
    },
    filename(req, file, cb) {
        cb(null, `product-${Date.now()}${path_1.default.extname(file.originalname)}`);
    },
});
// Check file type
function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png|webp/;
    const extname = filetypes.test(path_1.default.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
        return cb(null, true);
    }
    else {
        cb(new Error('Images only!'));
    }
}
const upload = (0, multer_1.default)({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});
// POST /api/upload — Upload a product image
router.post('/', authMiddleware_1.protect, authMiddleware_1.admin, upload.single('image'), (req, res) => {
    if (req.file) {
        res.json({
            message: 'Upload thành công!',
            url: `http://localhost:5000/uploads/products/${req.file.filename}`,
            filename: req.file.filename,
        });
    }
    else {
        res.status(400).json({ message: 'Không có file nào được tải lên.' });
    }
});
// DELETE /api/upload/:filename — Delete a product image file
router.delete('/:filename', authMiddleware_1.protect, authMiddleware_1.admin, (req, res) => {
    const filename = String(req.params.filename);
    const filePath = path_1.default.join(UPLOAD_DIR, filename);
    if (fs_1.default.existsSync(filePath)) {
        fs_1.default.unlink(filePath, (err) => {
            if (err) {
                res.status(500).json({ message: 'Không thể xoá file ảnh.' });
            }
            else {
                res.json({ message: 'Đã xoá ảnh thành công.' });
            }
        });
    }
    else {
        // File not found is OK — just respond success
        res.json({ message: 'File không tồn tại hoặc đã được xoá.' });
    }
});
exports.default = router;
