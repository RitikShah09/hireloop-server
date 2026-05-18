"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = exports.uploadResume = void 0;
const multer_1 = __importDefault(require("multer"));
const errors_1 = require("../utils/errors");
const storage = multer_1.default.memoryStorage();
const fileFilter = (allowedTypes) => {
    return (_req, file, cb) => {
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new errors_1.AppError(`File type ${file.mimetype} not allowed`, 400));
        }
    };
};
exports.uploadResume = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: fileFilter(['application/pdf']),
});
exports.uploadImage = (0, multer_1.default)({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/webp']),
});
//# sourceMappingURL=upload.middleware.js.map