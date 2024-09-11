import { Router } from 'express';
import { createController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import CategoriesController from './controller';
import { createCategorySchema, deleteCategorySchema, getCategoriesSchema, getCategoryByIdSchema, updateCategorySchema } from './validator.schema';

const categoryRouter: Router = Router();

const controller = createController(CategoriesController);

categoryRouter.get('/', ValidateRequest(getCategoriesSchema), controller.getCategories);

categoryRouter.get('/:categoryId', ValidateRequest(getCategoryByIdSchema), controller.getCategoryById);

categoryRouter.post('/', ValidateRequest(createCategorySchema), controller.createCategory);

categoryRouter.delete('/:categoryId', ValidateRequest(deleteCategorySchema), controller.deleteCategory);

categoryRouter.put('/:categoryId', ValidateRequest(updateCategorySchema), controller.updateCategory);

export default categoryRouter;
