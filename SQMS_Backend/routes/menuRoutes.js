import express from 'express';
import { getMenuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem ,getfeatured} from '../controllers/menuController.js';

const router = express.Router();

router.get('/', getMenuItems);
router.get('/featured',getfeatured);
router.post('/add',addMenuItem);
router.put('/:id',updateMenuItem);
router.delete('/:id',deleteMenuItem);


export default router;
