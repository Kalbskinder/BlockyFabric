import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import session from "express-session";
import SQLiteStore from "connect-sqlite3";

import authRoutes from './routes/auth.js';   // Auth Routes
import pageRoutes from './routes/pages.js';  // Page Routes
import imageUpload from './routes/imageUpload.js'; // Image Upload Routes
import apiRoutes from './routes/api.js'; // API Routes
import adminRoutes from './routes/admin.js'; // administration
import projectsRoutes from './routes/projects.js'; // Projects Routes

const app = express();
const PORT = 3000;
const SQLiteStoreInstance = SQLiteStore(session);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend', 'public')));
app.use(express.urlencoded({ extended: true }));
app.use('/bootstrap', express.static(path.join(__dirname, '../node_modules/bootstrap/dist')));

app.use(session({
    store: new SQLiteStoreInstance({ db: "./database/sessions.sqlite" }),
    secret: "supersecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false
    }
}));

app.set('view engine', 'ejs'); // EJS als Template-Engine
app.set('views', path.join(__dirname, '../frontend/views')); // Ordner für Views

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});


app.use('/auth', authRoutes); // Routes for authenticating
app.use('/upload', imageUpload);
app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);
app.use('/projects', projectsRoutes);
app.use('/', pageRoutes); // Routes for pages

app.listen(PORT, () => {
    console.log('\x1b[36m%s\x1b[0m', `[Server]  Node-Server running on port ${PORT} (http://localhost:${PORT})`);
});