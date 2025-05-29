import { Router } from 'express';
import { createController, ValidateRequest } from '@microservices/shared';
import CategoriesController from './controller';
import {
    changeTemplatesOrderSchema,
    createCategorySchema,
    deleteCategorySchema,
    getCategoriesSchema,
    getCategoryByIdSchema,
    updateCategorySchema,
} from './validator.schema';

const categoryRouter: Router = Router();

const controller = createController(CategoriesController);

categoryRouter.get('/', ValidateRequest(getCategoriesSchema), controller.getCategories);

categoryRouter.get('/:categoryId', ValidateRequest(getCategoryByIdSchema), controller.getCategoryById);

categoryRouter.post('/', ValidateRequest(createCategorySchema), controller.createCategory);

categoryRouter.delete('/:categoryId', ValidateRequest(deleteCategorySchema), controller.deleteCategory);

categoryRouter.put('/:categoryId', ValidateRequest(updateCategorySchema), controller.updateCategory);

categoryRouter.patch('/templatesOrder/:templateId', ValidateRequest(changeTemplatesOrderSchema), controller.updateCategoryTemplatesOrder);

export default categoryRouter;
