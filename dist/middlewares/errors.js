"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Errors = void 0;
const responses_1 = __importDefault(require("../responses"));
/**
 * Error handling middleware.
 *
 * @param {Error} err
 * @param {Request} req
 * @param {Response} res
 * @returns {void}
 */
const Errors = (err, req, res) => {
    if (!err) {
        return;
    }
    responses_1.default.error(res, 500, "InternalError", "Internal server error.").catch(() => { });
};
exports.Errors = Errors;
exports.default = exports.Errors;
//# sourceMappingURL=errors.js.map