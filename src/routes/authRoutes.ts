import { Router } from 'express';
import { register, login, getMe, updateMe, setupProfile } from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

router.post('/register',      register);
router.post('/login',         login);
router.get('/me',             protect, getMe);
router.put('/me',             protect, updateMe);
router.put('/me/profile',     protect, setupProfile); 

export default router;