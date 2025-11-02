import { SvgIconProps } from '@mui/material';
import React from 'react';
import { IconType } from 'react-icons/lib';
import * as biIcons from './boxIcons';
import * as fa6Icons from './fa6Icons';
import * as faIcons from './fontAwesome';
import * as muiIcons from './materialUI';

const profileAvatars = import.meta.glob('../../../public/icons/profileAvatar/*');

type AnyIcon = React.ElementType<SvgIconProps> | IconType;

const allIcons: Record<string, AnyIcon> = { ...muiIcons, ...faIcons, ...biIcons, ...fa6Icons };

const allProfileAvatars = Object.keys(profileAvatars).map((filePath) => {
    return filePath.split('/').pop();
});

export { allIcons, allProfileAvatars };
