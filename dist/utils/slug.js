"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSlug = void 0;
const uuid_1 = require("uuid");
const generateSlug = (title) => {
    const base = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 40);
    const suffix = (0, uuid_1.v4)().split('-')[0];
    return `${base}-${suffix}`;
};
exports.generateSlug = generateSlug;
//# sourceMappingURL=slug.js.map