import React, { CSSProperties } from 'react';
import { Grid, styled } from '@mui/material';
import { BlueTitle } from './BlueTitle';
import { environment } from '../globals';

export const TopBarGrid = styled(Grid)(({ theme }) => {
    const darkMode = theme.palette.mode === 'dark';

    return {
        backgroundColor: darkMode ? '#131313' : '#fcfeff',
        boxShadow: darkMode ? '0px 0.5px 0.5px #444' : '0px 4px 4px #0000000D',
        height: '3.6rem',
        padding: '0.5rem 2.5rem',
        marginBottom: '1rem',
        position: 'sticky',
        top: 0,
        right: 0,
        zIndex: 1,
    };
});

const TopBar: React.FC<{ title: string; boxStyle?: CSSProperties }> = ({ title, boxStyle }) => {
    if (title.length)
        return (
            <TopBarGrid sx={boxStyle} display="flex" alignItems="center">
                <BlueTitle title={title} component="h4" variant="h4" style={{ fontSize: environment.mainFontSizes.headlineTitleFontSize }} />
            </TopBarGrid>
        );

    return null;
};
export { TopBar };
