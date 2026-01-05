import { IUser } from '@packages/user';
import { environment } from '../globals';

const { kartoffelProfile } = environment.users;

export const isProfileFile = (profilePath?: string): boolean => {
    return !!profilePath && profilePath !== '' && profilePath !== kartoffelProfile;
};

export const defaultInputType = (profilePath?: string) => {
    if (!profilePath) return 'chooseAvatar';
    if (profilePath === kartoffelProfile) return kartoffelProfile;
    return 'chooseFile';
};

export const getNameInitials = (user: Partial<IUser>): string => {
    const names = user.fullName?.split(' ') ?? [];

    if (names.length < 3) return names.map((name) => name.charAt(0)).join('');

    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`;
};
