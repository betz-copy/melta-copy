import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IMongoCategory, IMongoEntityTemplatePopulated } from '../interfaces';

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
        setEntityTemplates: (state, action: PayloadAction<IMongoEntityTemplatePopulated[]>) => {
            state.entityTemplates = action.payload;
        },
        addEntityTemplate: (state, action: PayloadAction<IMongoEntityTemplatePopulated>) => {
            state.entityTemplates.push(action.payload);
        },
    },
});

export const { setCategories, setEntityTemplates, addCategory, addEntityTemplate } = globalStateSlice.actions;

export default globalStateSlice.reducer;
