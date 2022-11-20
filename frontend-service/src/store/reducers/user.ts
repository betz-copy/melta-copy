import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserState {
    id: string;
    adfsId: string;
    name: {
        firstName: string;
        lastName: string;
    };
    displayName: string;
    unit: string;
    rank: string;
}

const initialState: Partial<UserState> = {};

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (_state, action: PayloadAction<UserState>) => {
            return action.payload;
        },
    },
});

export const { setUser } = userSlice.actions;

export default userSlice.reducer;
