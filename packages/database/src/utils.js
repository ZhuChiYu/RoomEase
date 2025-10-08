"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptionUtils = exports.errorUtils = exports.dateUtils = exports.idUtils = exports.passwordUtils = void 0;
exports.createPaginationQuery = createPaginationQuery;
exports.createPaginationResult = createPaginationResult;
const client_1 = require("@prisma/client");
const bcryptjs_1 = require("bcryptjs");
const nanoid_1 = require("nanoid");
exports.passwordUtils = {
    async hash(password) {
        return bcryptjs_1.default.hash(password, 12);
    },
    async verify(password, hash) {
        return bcryptjs_1.default.compare(password, hash);
    }
};
exports.idUtils = {
    generateShortId(length = 8) {
        return (0, nanoid_1.nanoid)(length);
    },
    generateReservationId() {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = (0, nanoid_1.nanoid)(6).toUpperCase();
        return `RE${date}${random}`;
    }
};
function createPaginationQuery(options = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;
    return {
        skip,
        take: limit,
        page,
        limit
    };
}
function createPaginationResult(data, total, page, limit) {
    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
}
exports.dateUtils = {
    getDateRange(start, end) {
        const dates = [];
        const current = new Date(start);
        while (current <= end) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return dates;
    },
    getDaysBetween(start, end) {
        const timeDiff = end.getTime() - start.getTime();
        return Math.ceil(timeDiff / (1000 * 3600 * 24));
    },
    isDateRangeOverlap(start1, end1, start2, end2) {
        return start1 < end2 && start2 < end1;
    }
};
exports.errorUtils = {
    handlePrismaError(error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            switch (error.code) {
                case 'P2002':
                    return '该记录已存在';
                case 'P2025':
                    return '记录不存在';
                case 'P2003':
                    return '外键约束失败';
                default:
                    return '数据库操作失败';
            }
        }
        return error.message || '未知错误';
    }
};
exports.encryptionUtils = {
    encrypt(data) {
        return Buffer.from(data, 'utf8').toString('base64');
    },
    decrypt(encryptedData) {
        return Buffer.from(encryptedData, 'base64').toString('utf8');
    }
};
//# sourceMappingURL=utils.js.map