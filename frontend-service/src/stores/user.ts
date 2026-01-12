import { ISubCompactPermissions } from '@packages/permission';
import { IUser } from '@packages/user';
import { create } from 'zustand';

export interface UserState {
    user: {
        id: string;
        adfsId: string;
        isRoot: boolean;
        name: {
            firstName: string;
            lastName: string;
        };
        displayName: string;
        unit: string;
        rank: string;
        exp: number;
        iat: number;

        currentWorkspacePermissions: ISubCompactPermissions;
        kartoffelId?: string;
        clientSideWorkspaceId?: string;
    } & IUser;
    setUser: (user: UserState['user']) => void;
}

export const useUserStore = create<UserState>((set) => ({
    user: {
        id: '',
        adfsId: '',
        name: {
            firstName: '',
            lastName: '',
        },
        displayName: '',
        unit: '',
        rank: '',
        exp: 0,
        iat: 0,
        isRoot: false,

        _id: '',
        fullName: '',
        jobTitle: '',
        hierarchy: '',
        mail: '',
        profile: '',
        preferences: {},
        kartoffelId: '',
        permissions: {},
        units: {},
        currentWorkspacePermissions: {},
        usersUnitsWithInheritance: [],
    },
    setUser: (user) => set({ user }),
}));
