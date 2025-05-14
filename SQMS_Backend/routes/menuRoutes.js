import express from 'express';
import { getMenuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem ,getfeatured} from '../controllers/menuController.js';

const router = express.Router();

router.get('/', getMenuItems);
router.post('/add', addMenuItem);
router.put('/:id', updateMenuItem);
router.delete('/:id', deleteMenuItem);
router.get('/featured',getfeatured);
export default router;
