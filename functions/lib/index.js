"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.health = void 0;
const app_1 = require("firebase-admin/app");
const https_1 = require("firebase-functions/v2/https");
const firebase_functions_1 = require("firebase-functions");
(0, app_1.initializeApp)();
exports.health = (0, https_1.onRequest)((request, response) => {
    firebase_functions_1.logger.info('Health check requested', {
        method: request.method,
        path: request.path,
    });
    response.json({
        ok: true,
        service: 'qova-functions',
    });
});
//# sourceMappingURL=index.js.map