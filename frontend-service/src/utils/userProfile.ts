import { IUser } from '@packages/user';
import { environment } from '../globals';
import { InputPickerType } from '../interfaces/inputs';

const { kartoffelProfile } = environment.users;

export const isProfileFile = (profilePath?: string): boolean => {
    return !!profilePath && profilePath !== '' && profilePath !== kartoffelProfile;
};

export const defaultInputType = (profilePath?: string): InputPickerType => {
    if (!profilePath) return InputPickerType.ChooseAvatar;
    if (profilePath === kartoffelProfile) return InputPickerType.KartoffelProfile;
    return InputPickerType.ChooseFile;
};

export const getNameInitials = (user: Partial<IUser>): string => {
    const names = user.fullName?.split(' ') ?? [];

    if (names.length < 3) return names.map((name) => name.charAt(0)).join('');

    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`;
};
