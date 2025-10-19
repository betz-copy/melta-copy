import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider } from '@mui/material';
import React, { ReactNode } from 'react';

const ltrCache = createCache({
    key: 'muiltr',
});

export const LTRProvider: React.FC<{ children?: ReactNode }> = ({ children }) => {
    return (
        <CacheProvider value={ltrCache}>
            <ThemeProvider theme={(outerTheme) => ({ ...outerTheme, direction: 'ltr' })}>
                <div dir="ltr">{children}</div>
            </ThemeProvider>
        </CacheProvider>
    );
};
