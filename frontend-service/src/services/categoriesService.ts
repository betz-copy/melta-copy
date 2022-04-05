import axios from '../axios';
import { CategoryWizardValues } from '../common/wizards/category';
import { environment } from '../globals';
import { IMongoCategory } from '../interfaces/categories';

const { categories } = environment.api;

const categoryObjectToCategoryForm = (category: IMongoCategory | null): CategoryWizardValues | undefined => {
    if (!category) return undefined;
    const { iconFileId, ...restOfCategory } = category;

    if (iconFileId) {
        const file: Partial<File> = { name: iconFileId };
        return { ...restOfCategory, file };
    }

    return restOfCategory;
};

const getCategoriesRequest = async () => {
    const { data } = await axios.get<IMongoCategory[]>(categories);
    return data;
};

const createCategoryRequest = async (newCategory: CategoryWizardValues) => {
    const formData = new FormData();

    if (newCategory.file) {
        formData.append('file', newCategory.file as File);
    }
    formData.append('displayName', newCategory.displayName);
    formData.append('name', newCategory.name);
    formData.append('color', newCategory.color);

    const { data } = await axios.post(categories, formData);
    return data;
};

const updateCategoryRequest = async (categoryId: string, updatedCategory: CategoryWizardValues) => {
    const formData = new FormData();

    if (updatedCategory.file) {
        formData.append('file', updatedCategory.file as File);
    }
    formData.append('displayName', updatedCategory.displayName);
    formData.append('name', updatedCategory.name);
    formData.append('color', updatedCategory.color);

    const { data } = await axios.put<IMongoCategory>(`${categories}/${categoryId}`, updatedCategory);
    return data;
};

const deleteCategoryRequest = async (categoryId: string) => {
    const { data } = await axios.delete(`${categories}/${categoryId}`);
    return data;
};

export { getCategoriesRequest, createCategoryRequest, updateCategoryRequest, categoryObjectToCategoryForm, deleteCategoryRequest };
