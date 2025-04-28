import { Typography } from '@mui/material';
import i18next from 'i18next';
import React from 'react';

export const NoPermissions: React.FC = () => {
    return (
        <Typography fontSize="16px" fontWeight="500" color="primary">
            {i18next.t('errorPage.noPermissions')}
        </Typography>
    );
};
