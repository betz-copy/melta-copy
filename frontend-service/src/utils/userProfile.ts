import { IUser } from '../interfaces/users';

export const isProfileFile = (profilePath?: string): boolean => {
    return !!profilePath && profilePath !== '' && !profilePath.startsWith('/icons/profileAvatar') && profilePath !== 'kartoffelProfile';
};

export const defaultInputType = (profilePath?: string) => {
    if (!profilePath || profilePath.startsWith('/icons/profileAvatar')) return 'chooseAvatar';
    if (profilePath === 'kartoffelProfile') return 'kartoffelProfile';
    return 'chooseFile';
};

export const getNameInitials = (user: IUser): string => {
    const names = user.fullName?.split(' ') ?? [];

    if (names.length < 3) return names.map((name) => name.charAt(0)).join('');

    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`;
};
