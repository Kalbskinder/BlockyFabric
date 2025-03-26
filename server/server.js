import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend', 'public')));
app.use('/bootstrap', express.static(path.join(__dirname, '../node_modules/bootstrap/dist')));



app.set('view engine', 'ejs'); // EJS als Template-Engine
app.set('views', path.join(__dirname, '../frontend/views')); // Ordner für Views


app.listen(PORT, () => {
    console.log('\x1b[36m%s\x1b[0m', `[Server]  Node-Server running on port ${PORT} (http://localhost:${PORT})`);
});

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/login', (req, res) => {
    res.render('pages/login');
});

app.get('/docs', (req, res) => {
    res.render('pages/documentation');
});

// Must be called last
app.use((req, res) => {
    res.status(404).render('pages/404');
});