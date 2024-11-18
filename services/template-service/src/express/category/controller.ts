/* eslint-disable lines-between-class-members */
import { Request, Response } from 'express';
import { IMongoCategory } from '@microservices/shared';
import DefaultController from '../../utils/express/controller';
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
}

export default CategoriesController;
