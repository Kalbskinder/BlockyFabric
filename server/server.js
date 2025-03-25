import express from 'express';

const app = express();
const PORT = 3000;

app.use(express.json());

app.listen(PORT, () => {
    console.log('\x1b[36m%s\x1b[0m', `[Server]  Node-Server running on port ${PORT} (http://localhost:${PORT})`);
});