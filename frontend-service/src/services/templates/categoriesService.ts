import { IMongoCategory } from '@packages/category';
import axios from '../../axios';
import { CategoryWizardValues } from '../../common/wizards/category';
import { environment } from '../../globals';
import { getFileName } from '../../utils/getFileName';

const { categories } = environment.api;

const categoryObjectToCategoryForm = (category: IMongoCategory | null): CategoryWizardValues | undefined => {
    if (!category) return undefined;
    const { iconFileId, ...restOfCategory } = category;

    if (iconFileId) {
        const file: Partial<File> = { name: iconFileId };
        return { ...restOfCategory, icon: { file, name: getFileName(iconFileId) } };
    }
    return restOfCategory;
};

const getAllCategoryRequest = async () => {
    const { data } = await axios.get(`${categories}`);
    return data;
};

const createCategoryRequest = async (newCategory: CategoryWizardValues) => {
    const formData = new FormData();

    if (newCategory.icon) {
        formData.append('file', newCategory.icon.file as File);
    }
    formData.append('displayName', newCategory.displayName);
    formData.append('name', newCategory.name);
    formData.append('color', newCategory.color);

    const { data } = await axios.post(categories, formData);
    return data;
};

const updateCategoryRequest = async (categoryId: string, updatedCategory: CategoryWizardValues) => {
    const formData = new FormData();

    if (updatedCategory.icon) {
        if (updatedCategory.icon.file instanceof File) {
            formData.append('file', updatedCategory.icon.file);
        } else {
            formData.append('iconFileId', updatedCategory.icon.file.name!);
        }
    }

    formData.append('displayName', updatedCategory.displayName);
    formData.append('name', updatedCategory.name);
    formData.append('color', updatedCategory.color);

    const { data } = await axios.put<IMongoCategory>(`${categories}/${categoryId}`, formData);
    return data;
};

const deleteCategoryRequest = async (categoryId: string) => {
    const { data } = await axios.delete(`${categories}/${categoryId}`);
    return data;
};

const updateCategoryTemplatesOrderRequest = async (templateId: string, newIndex: number, srcCategoryId: string, newCategoryId: string) => {
    const { data } = await axios.patch(`${categories}/templatesOrder/${templateId}`, { newIndex, srcCategoryId, newCategoryId });

    return data;
};

export {
    createCategoryRequest,
    getAllCategoryRequest,
    updateCategoryRequest,
    categoryObjectToCategoryForm,
    deleteCategoryRequest,
    updateCategoryTemplatesOrderRequest,
};
