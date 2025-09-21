import { WidgetProps } from '@rjsf/utils';
import React from 'react';
import UserAvatar from '../../UserAvatar';
import { Box, Typography } from '@mui/material';

const RjsfUserAvatarWidget = ({ options: { user }, label }: WidgetProps) => {
    return (
        <Box display="flex" alignItems="center" gap={'2rem'}>
            <Typography sx={{ color: '#9398C2' }}>{label}</Typography>
            {user ? <UserAvatar user={user} shouldRenderChip={false} userIcon={{ size: 42 }} /> : <></>}
        </Box>
    );
};

export default RjsfUserAvatarWidget;
