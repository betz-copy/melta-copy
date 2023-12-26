import { configureStore } from '@reduxjs/toolkit';
import userReducer from './reducers/user';
import meltaPlusReducer from './reducers/meltaPlus';
import darkModeReducer from './reducers/darkMode';

export const store = configureStore({
    reducer: {
        user: userReducer,
        meltaPlus: meltaPlusReducer,
        darkMode: darkModeReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
