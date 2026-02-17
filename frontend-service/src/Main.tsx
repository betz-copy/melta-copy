import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { CssBaseline } from '@mui/material';
import { WorkspaceTypes } from '@packages/workspace';
import React from 'react';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import { Route, Switch } from 'wouter';
import DirView from './pages/DirView';
import { MeltaRoutes } from './pages/MeltaRoutes';

const cacheRtl = createCache({
    key: 'muirtl',
    stylisPlugins: [prefixer, rtlPlugin],
});

const Main: React.FC = () => {
    return (
        <CacheProvider value={cacheRtl}>
            <CssBaseline />
            <Switch>
                <Route path={`*/:path${WorkspaceTypes.mlt}`} nest>
                    {(params: { '*': string; path: string }) => <MeltaRoutes path={`/${params['*']}/${params.path}${WorkspaceTypes.mlt}`} />}
                </Route>

                <Route path="*">{(params) => <DirView params={params} />}</Route>
            </Switch>
        </CacheProvider>
    );
};

export default Main;
