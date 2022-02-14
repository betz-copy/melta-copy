import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IMongoCategory } from '../interfaces/categories';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';

export interface GlobalState {
    categories: IMongoCategory[];
    entityTemplates: IMongoEntityTemplatePopulated[];
}

const initialState: GlobalState = {
    categories: [],
    entityTemplates: [],
};

export const globalStateSlice = createSlice({
    name: 'globalState',
    initialState,
    reducers: {
        setCategories: (state, action: PayloadAction<IMongoCategory[]>) => {
            state.categories = action.payload;
        },
        addCategory: (state, action: PayloadAction<IMongoCategory>) => {
            state.categories.push(action.payload);
        },
        updateCategory: (state, action: PayloadAction<IMongoCategory>) => {
            const updatedCategory = state.categories.find((category) => category._id === action.payload._id);

            if (updatedCategory) {
                updatedCategory.displayName = action.payload.displayName;
                updatedCategory.name = action.payload.name;
            }
        },
        setEntityTemplates: (state, action: PayloadAction<IMongoEntityTemplatePopulated[]>) => {
            state.entityTemplates = action.payload;
        },
        addEntityTemplate: (state, action: PayloadAction<IMongoEntityTemplatePopulated>) => {
            state.entityTemplates.push(action.payload);
        },
        updateEntityTemplate: (state, action: PayloadAction<IMongoEntityTemplatePopulated>) => {
            const updatedEntityTemplate = state.entityTemplates.find((entityTemplate) => entityTemplate._id === action.payload._id);

            if (updatedEntityTemplate) {
                updatedEntityTemplate.displayName = action.payload.displayName;
                updatedEntityTemplate.name = action.payload.name;
                updatedEntityTemplate.category = action.payload.category;
                updatedEntityTemplate.properties = action.payload.properties;
            }
        },
    },
});

export const { setCategories, setEntityTemplates, addCategory, addEntityTemplate, updateCategory, updateEntityTemplate } = globalStateSlice.actions;

export default globalStateSlice.reducer;
