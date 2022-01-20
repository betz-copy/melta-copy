import { configureStore } from '@reduxjs/toolkit';
import userReducer from './user';
import backendConfigReducer from './backendConfig';
import userPreferencesReducer from './userPreferences';

export const store = configureStore({
    reducer: {
        user: userReducer,
        backendConfig: backendConfigReducer,
        userPreferences: userPreferencesReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
