import { IUser } from '../interfaces/users';

export const isProfileFileType = (profilePath?: string): boolean => {
    return (
        !!profilePath &&
        profilePath !== '' &&
        !profilePath.startsWith('/icons/profileAvatar') &&
        !profilePath.startsWith('http://') &&
        !profilePath.startsWith('https://')
    );
};

export const defaultInputType = (profilePath?: string) => {
    if (!profilePath || profilePath.startsWith('/icons/profileAvatar')) return 'chooseAvatar';
    if (profilePath.startsWith('http://') || profilePath.startsWith('https://')) return 'kartoffelProfile';
    return 'chooseFile';
};

export const getNameInitials = (user: IUser): string => {
    const names = user.fullName?.split(' ') ?? [];

    if (names.length < 3) return names.map((name) => name.charAt(0)).join('');

    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`;
};
