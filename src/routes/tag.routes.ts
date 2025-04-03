import express from 'express';
import * as tagController from '../controllers/tag.controller';
import { validateRequestBody } from '../middlewares/validation.middleware'; // Use the correct export
import { createTagSchema, updateTagSchema } from '../validations/tag.validation';
// import { isAdmin, protect } from '../middlewares/auth.middleware'; // Assuming auth middleware

const router = express.Router();

// Public routes (adjust as needed)
router.get('/', tagController.getTags);
router.get('/:id', tagController.getTag);

// Admin/Protected routes (Uncomment and adjust middleware as needed)
// router.use(protect); // Apply authentication to routes below
// router.use(isAdmin); // Apply admin check to routes below

router.post(
    '/',
    validateRequestBody(createTagSchema), // Use validateRequestBody
    tagController.createTagHandler
);

router.put(
    '/:id',
    validateRequestBody(updateTagSchema), // Use validateRequestBody
    tagController.updateTagHandler
);

router.delete(
    '/:id',
    tagController.deleteTagHandler
);

export default router;
