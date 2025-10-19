/* eslint-disable lines-between-class-members */
import { Request, Response } from 'express';
import { DefaultController, IMongoCategory } from '@microservices/shared';
import CategoryManager from './manager';

class CategoriesController extends DefaultController<IMongoCategory, CategoryManager> {
    constructor(workspaceId: string) {
        super(new CategoryManager(workspaceId));
    }

    async getCategories(req: Request, res: Response) {
        res.json(await this.manager.getCategories(req.query.search as string));
    }

    async getCategoryById(req: Request, res: Response) {
        res.json(await this.manager.getCategoryById(req.params.categoryId));
    }

    async createCategory(req: Request, res: Response) {
        res.json(await this.manager.createCategory(req.body));
    }

    async deleteCategory(req: Request, res: Response) {
        res.json(await this.manager.deleteCategory(req.params.categoryId));
    }

    async updateCategory(req: Request, res: Response) {
        res.json(await this.manager.updateCategory(req.params.categoryId, req.body));
    }

    async updateCategoryTemplatesOrder(req: Request, res: Response) {
        const { srcCategoryId, newCategoryId, newIndex } = req.body;

        res.json(await this.manager.updateCategoryTemplatesOrder(req.params.templateId, newCategoryId, srcCategoryId, newIndex));
    }
}

export default CategoriesController;
