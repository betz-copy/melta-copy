import React, { CSSProperties } from 'react';
import { Grid, styled, useTheme } from '@mui/material';
import { Hive as HiveIcon } from '@mui/icons-material';
import { BlueTitle } from './BlueTitle';
import { environment } from '../globals';
import { CustomIcon } from './CustomIcon';

export const TopBarGrid = styled(Grid)(({ theme }) => {
    const bgColor: CSSProperties['backgroundColor'] = theme.palette.mode === 'dark' ? '#131313' : '#fcfeff';

    return {
        backgroundColor: bgColor,
        boxShadow: '0px 4px 4px #0000000D',
        height: '3.6rem',
        padding: '0.5rem 2.5rem',
        marginBottom: '1rem',
        position: 'sticky',
        top: 0,
        right: 0,
        zIndex: 1,
    };
});

const TopBar: React.FC<{ title: string; boxStyle?: CSSProperties; iconFileId?: string | null }> = ({ title, boxStyle, iconFileId = null }) => {
    const theme = useTheme();

    if (title.length)
        return (
            <TopBarGrid sx={boxStyle} display="flex" alignItems="center">
                {iconFileId === '' ? (
                    <HiveIcon style={{ color: theme.palette.primary.main, marginLeft: '25px' }} fontSize="medium" />
                ) : (
                    <CustomIcon color={theme.palette.primary.main} iconUrl={iconFileId!} height="24px" width="24px" style={{ marginLeft: '25px' }} />
                )}
                <BlueTitle title={title} component="h4" variant="h4" style={{ fontSize: environment.mainFontSizes.headlineTitleFontSize }} />
            </TopBarGrid>
        );

    return null;
};
export { TopBar };
