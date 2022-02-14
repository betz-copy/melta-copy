import axios from '../axios';
import { environment } from '../globals';
import { ICategory, IMongoCategory } from '../interfaces/categories';

const { categories } = environment.api;

const getCategoriesRequest = async () => {
    const { data } = await axios.get<IMongoCategory[]>(categories);
    return data;
};

const createCategoryRequest = async (newCategory: ICategory) => {
    const { data } = await axios.post<IMongoCategory>(categories, newCategory);
    return data;
};

const updateCategoryRequest = async (categoryId: string, updatedCategory: ICategory) => {
    const { data } = await axios.put<IMongoCategory>(`${categories}/${categoryId}`, updatedCategory);
    return data;
};

export { getCategoriesRequest, createCategoryRequest, updateCategoryRequest };
