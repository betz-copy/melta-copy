import { Box, BoxProps, styled } from '@mui/material';
import { CSSProperties } from 'react';

const MainBox = styled(Box, { shouldForwardProp: (prop) => prop !== 'scrollBarMarginTop' })<
    BoxProps & { scrollBarMarginTop?: CSSProperties['marginTop'] }
>(({ theme, scrollBarMarginTop = '3.6rem' }) => {
    const scrollbarBackground = theme.palette.mode === 'light' ? 'white' : '#131313';

    return {
        backgroundColor: theme.palette.mode === 'light' ? '#F0F2F7' : '#252527',
        flexGrow: 1,
        height: '100vh',
        '::-webkit-scrollbar': { background: scrollbarBackground, width: 10 },
        '::-webkit-scrollbar-track': { background: scrollbarBackground, marginTop: scrollBarMarginTop, borderRadius: 0 },
        '::-webkit-scrollbar-thumb': { background: theme.palette.primary.main },
    };
});

export { MainBox };
