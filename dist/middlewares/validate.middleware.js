"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZodError = exports.parseRequest = exports.formatZodErrors = void 0;
const zod_1 = require("zod");
Object.defineProperty(exports, "ZodError", { enumerable: true, get: function () { return zod_1.ZodError; } });
const formatZodErrors = (issues) => {
    const errors = {};
    issues.forEach((issue) => {
        const field = issue.path.slice(1).join('.') || '_root';
        if (!errors[field])
            errors[field] = [];
        errors[field].push(issue.message);
    });
    return errors;
};
exports.formatZodErrors = formatZodErrors;
const parseRequest = (schema, req) => schema.parse({
    body: req.body,
    query: req.query,
    params: req.params,
});
exports.parseRequest = parseRequest;
//# sourceMappingURL=validate.middleware.js.map