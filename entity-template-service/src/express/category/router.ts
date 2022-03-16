import { Router } from 'express';
import * as multer from 'multer';
import ValidateRequest from '../../utils/joi';
import { wrapController } from '../../utils/express';
import { getCategoriesSchema, getCategoryByIdSchema, createCategorySchema, deleteCategorySchema, updateCategorySchema } from './validator.schema';
import CategoriesController from './controller';
import config from '../../config';

const { uploadsFolderPath } = config.service;

const categoryRouter: Router = Router();

categoryRouter.get('/', ValidateRequest(getCategoriesSchema), wrapController(CategoriesController.getCategories));

categoryRouter.get('/:categoryId', ValidateRequest(getCategoryByIdSchema), wrapController(CategoriesController.getCategoryById));

categoryRouter.post(
    '/',
    multer({ dest: uploadsFolderPath }).single('file'),
    ValidateRequest(createCategorySchema),
    wrapController(CategoriesController.createCategory),
);

categoryRouter.delete('/:categoryId', ValidateRequest(deleteCategorySchema), wrapController(CategoriesController.deleteCategory));

categoryRouter.put(
    '/:categoryId',
    multer({ dest: uploadsFolderPath }).single('file'),
    ValidateRequest(updateCategorySchema),
    wrapController(CategoriesController.updateCategory),
);

export default categoryRouter;
