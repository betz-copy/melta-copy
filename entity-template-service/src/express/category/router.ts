import { Router } from 'express';
import { addControllerBetterBetter } from '../../utils/express/router.middleware';
import ValidateRequest from '../../utils/joi';
import CategoriesController from './controller';
import { createCategorySchema, deleteCategorySchema, getCategoriesSchema, getCategoryByIdSchema, updateCategorySchema } from './validator.schema';
import { ICategory } from './interface';
import CategoryManager from './manager';

const categoryRouter: Router = Router();

// const controller = addControllerBetter(CategoriesController)<CategoriesController>;
const controller = addControllerBetterBetter(CategoriesController);

// categoryRouter.get('/', ValidateRequest(getCategoriesSchema), controller('getCategories'));
categoryRouter.get('/', ValidateRequest(getCategoriesSchema), controller('getCategories'));

categoryRouter.get('/:categoryId', ValidateRequest(getCategoryByIdSchema), controller('getCategoryById'));

categoryRouter.post('/', ValidateRequest(createCategorySchema), controller('createCategory'));

categoryRouter.delete('/:categoryId', ValidateRequest(deleteCategorySchema), controller('deleteCategory'));

categoryRouter.put('/:categoryId', ValidateRequest(updateCategorySchema), controller('updateCategory'));

export default categoryRouter;
