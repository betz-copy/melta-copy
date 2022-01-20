import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface BackendConfigState {
    contactByMailLink: string;
    contactByChatLink: string;
}

const initialState: BackendConfigState = {
    contactByMailLink: 'unknown',
    contactByChatLink: 'unknown',
};

export const backendConfigSlice = createSlice({
    name: 'backendConfig',
    initialState,
    reducers: {
        setConfig: (_state, action: PayloadAction<BackendConfigState>) => {
            return action.payload;
        },
    },
});

export const { setConfig } = backendConfigSlice.actions;

export default backendConfigSlice.reducer;
