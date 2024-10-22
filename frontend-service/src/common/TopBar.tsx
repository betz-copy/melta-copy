import React, { CSSProperties } from 'react';
import { Grid, styled } from '@mui/material';
import { BlueTitle } from './BlueTitle';
import { useWorkspaceStore } from '../stores/workspace';

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

const TopBar: React.FC<{ title: string; boxStyle?: CSSProperties }> = ({ title, boxStyle }) => {
    const workspace = useWorkspaceStore((state) => state.workspace);

    if (title.length) {
        return (
            <TopBarGrid sx={boxStyle} display="flex" alignItems="center">
                <BlueTitle title={title} component="h4" variant="h4" style={{ fontSize: workspace.metadata.mainFontSizes.headlineTitleFontSize }} />
            </TopBarGrid>
        );
    }

    return null;
};
export { TopBar };
