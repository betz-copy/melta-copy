import { Request, Response } from 'express';
import CategoryManager from './manager';

class CategoriesController {
    static async getCategories(req: Request, res: Response) {
        res.json(await CategoryManager.getCategories(req.query.search as string));
    }

    static async getCategoryById(req: Request, res: Response) {
        res.json(await CategoryManager.getCategoryById(req.params.categoryId));
    }

    static async createCategory(req: Request, res: Response) {
        res.json(await CategoryManager.createCategory(req.body, req.file));
    }

    static async deleteCategory(req: Request, res: Response) {
        res.json(await CategoryManager.deleteCategory(req.params.categoryId));
    }

    static async updateCategory(req: Request, res: Response) {
        res.json(await CategoryManager.updateCategory(req.params.categoryId, req.body, req.file));
    }
}

export default CategoriesController;
