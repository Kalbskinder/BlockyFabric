import express from 'express';

const router = express.Router();

router.get('/loggedIn', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true });
    } else {
        res.json({ loggedIn: false });
    }
    return res.status(200);
});

export default router;