import { Router } from 'express';
import ValidateRequest from '../../utils/joi';
import { wrapController } from '../../utils/express';
import { getCategoriesSchema, getCategoryByIdSchema, createCategorySchema, deleteCategorySchema, updateCategorySchema } from './validator.schema';
import CategoriesController from './controller';

const categoryRouter: Router = Router();

categoryRouter.get('/', ValidateRequest(getCategoriesSchema), wrapController(CategoriesController.getCategories));

categoryRouter.get('/:categoryId', ValidateRequest(getCategoryByIdSchema), wrapController(CategoriesController.getCategoryById));

categoryRouter.post('/', ValidateRequest(createCategorySchema), wrapController(CategoriesController.createCategory));

categoryRouter.delete('/:categoryId', ValidateRequest(deleteCategorySchema), wrapController(CategoriesController.deleteCategory));

categoryRouter.put('/:categoryId', ValidateRequest(updateCategorySchema), wrapController(CategoriesController.updateCategory));

export default categoryRouter;
