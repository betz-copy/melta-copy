import { create } from 'zustand';
import { ISubCompactPermissions } from '../interfaces/permissions/permissions';
import { IUser } from '../interfaces/users';

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
        units?: Record<string, string[]>;
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
        currentWorkspacePermissions: {},
    },
    setUser: (user) => set({ user }),
}));
