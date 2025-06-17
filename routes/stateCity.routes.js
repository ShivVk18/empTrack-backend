import express from 'express';
import { getStates } from '../controllers/state.controller.js';
import { getCities } from '../controllers/city.controller.js';
const router = express.Router();

router.route('/').get(getStates)
router.route('/:stateId/cities').get(getCities);


export default router;