import { IMongoCategory } from '@packages/category';
import { DefaultController } from '@packages/utils';
import { Request, Response } from 'express';
import CategoryManager from './manager';

class CategoriesController extends DefaultController<IMongoCategory, CategoryManager> {
    constructor(workspaceId: string) {
        super(new CategoryManager(workspaceId));
    }

    async getCategories(req: Request, res: Response) {
        res.json(await this.manager.getCategories(req.query.search as string));
    }

    async getCategoryById(req: Request, res: Response) {
        res.json(await this.manager.getCategoryById(req.params.categoryId as string));
    }

    async createCategory(req: Request, res: Response) {
        res.json(await this.manager.createCategory(req.body));
    }

    async deleteCategory(req: Request, res: Response) {
        res.json(await this.manager.deleteCategory(req.params.categoryId as string));
    }

    async updateCategory(req: Request, res: Response) {
        res.json(await this.manager.updateCategory(req.params.categoryId as string, req.body));
    }

    async updateCategoryTemplatesOrder(req: Request, res: Response) {
        const { srcCategoryId, newCategoryId, newIndex } = req.body;

        res.json(await this.manager.updateCategoryTemplatesOrder(req.params.templateId as string, newCategoryId, srcCategoryId, newIndex));
    }
}

export default CategoriesController;
