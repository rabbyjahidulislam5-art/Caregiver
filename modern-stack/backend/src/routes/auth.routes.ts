import { Router } from 'express';
import { register, login, logout, getProfile } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/profile/:userId', getProfile);

export default router;
