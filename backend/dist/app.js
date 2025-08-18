"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const dotenv_1 = __importDefault(require("dotenv"));
const system_1 = __importDefault(require("./routes/system"));
const config_1 = __importDefault(require("./routes/config"));
const generation_1 = __importDefault(require("./routes/generation"));
const projects_1 = __importDefault(require("./routes/projects"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8000;
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
app.use('/outputs', express_1.default.static(path_1.default.join(__dirname, '../../outputs')));
app.use('/projects', express_1.default.static(path_1.default.join(__dirname, '../../projects')));
app.use('/api/system', system_1.default);
app.use('/api/config', config_1.default);
app.use('/api/generation', generation_1.default);
app.use('/api/projects', projects_1.default);
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
const ensureDirectories = async () => {
    const dirs = [
        path_1.default.join(__dirname, '../../outputs/images'),
        path_1.default.join(__dirname, '../../outputs/videos'),
        path_1.default.join(__dirname, '../../projects'),
        path_1.default.join(__dirname, '../../config'),
        path_1.default.join(__dirname, '../../img')
    ];
    for (const dir of dirs) {
        await fs_extra_1.default.ensureDir(dir);
    }
};
const startServer = async () => {
    try {
        await ensureDirectories();
        app.listen(PORT, () => {
            console.log(`🚀 EasyVideo Backend Server running on port ${PORT}`);
            console.log(`📁 Static files served from outputs and projects directories`);
            console.log(`🔗 API endpoints available at http://localhost:${PORT}/api`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
exports.default = app;
//# sourceMappingURL=app.js.map