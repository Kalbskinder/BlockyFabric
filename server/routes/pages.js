import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
    res.render('index');
});

router.get('/login', (req, res) => {
    res.render('pages/login');
});

router.get('/docs', (req, res) => {
    res.render('pages/documentation');
});

router.get('/dashboard', (req, res) => {
    res.render('pages/dashboard');
});

router.get('/profile', (req, res) => {
    res.render('pages/profile');
});

router.get('/settings', (req, res) => {
    res.render('pages/settings');
});

router.get('/explore', (req, res) => {
    res.render('pages/explore');
});

export default router;