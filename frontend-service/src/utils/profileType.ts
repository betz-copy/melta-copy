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
