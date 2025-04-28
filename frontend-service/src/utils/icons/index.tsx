import React from 'react';
import { IconType } from 'react-icons/lib';
import { SvgIconProps } from '@mui/material';
import * as fa6Icons from './fa6Icons';
import * as muiIcons from './materialUI';
import * as faIcons from './fontAwesome';
import * as biIcons from './boxIcons';

const profileAvatars = import.meta.glob('../../../public/icons/profileAvatar/*');

type AnyIcon = React.ElementType<SvgIconProps> | IconType;

const allIcons: Record<string, AnyIcon> = { ...muiIcons, ...faIcons, ...biIcons, ...fa6Icons };

const allProfileAvatars = Object.keys(profileAvatars).map((filePath) => {
    return filePath.split('/').pop();
});

export { allIcons, allProfileAvatars };
