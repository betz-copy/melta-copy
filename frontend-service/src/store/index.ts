import { configureStore } from '@reduxjs/toolkit';
import userReducer from './user';
import meltaPlusReducer from './meltaPlus';

export const store = configureStore({
    reducer: {
        user: userReducer,
        meltaPlus: meltaPlusReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
