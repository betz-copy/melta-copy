import React from 'react';
import { CustomIcon, CustomImage } from './CustomIcon';

interface IMeltaIconProps {
    iconUrl?: string;
    width?: React.CSSProperties['width'];
    height?: React.CSSProperties['height'];
    expanded?: boolean;
    style?: React.CSSProperties;
    workspaceId?: string;
}

export const MeltaIcon: React.FC<IMeltaIconProps> = ({ iconUrl, width, height, expanded = false, style, workspaceId }) => {
    const props = { width, height, style, workspaceId, preserveColor: true };

    if (!iconUrl) return <CustomImage imageUrl={expanded ? '/icons/Melta_Logo.svg' : '/icons/Melta_Short_Logo.svg'} {...props} />;

    return <CustomIcon iconUrl={iconUrl} {...props} />;
};
