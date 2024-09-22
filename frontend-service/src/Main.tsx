import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { CssBaseline } from '@mui/material';
import React from 'react';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import { Route, Switch } from 'wouter';
import { WorkspaceTypes } from './interfaces/workspaces';
import DirView from './pages/DirView';
import { MeltaRoutes } from './pages/MeltaRoutes';

const cacheRtl = createCache({
    key: 'muirtl',
    stylisPlugins: [prefixer, rtlPlugin],
});

const Main: React.FC = () => {
    // const [activeTheme, setActiveTheme] = useState(lightTheme);

    // useEffect(() => {
    //     const savedScrollPosition = sessionStorage.getItem(`scrollPosition-${window.location.pathname}`);

    //     if (savedScrollPosition && pageScrollTarget) {
    //         setTimeout(() => {
    //             requestAnimationFrame(() => {
    //                 pageScrollTarget.scrollTo({
    //                     top: parseInt(savedScrollPosition, 10),
    //                     behavior: 'smooth',
    //                 });
    //             });
    //         }, 150);
    //     }

    //     const handleScroll = debounce(() => {
    //         if (pageScrollTarget) {
    //             sessionStorage.setItem(`scrollPosition-${window.location.pathname}`, pageScrollTarget.scrollTop.toString());
    //         }
    //     }, 300);

    //     if (pageScrollTarget) {
    //         pageScrollTarget.addEventListener('scroll', handleScroll);
    //     }

    //     return () => {
    //         if (pageScrollTarget) {
    //             pageScrollTarget.removeEventListener('scroll', handleScroll);
    //         }
    //     };
    // }, [pageScrollTarget, window.location.pathname]);

    // TODO - implement when dark mode will be supported
    // const handleToggleTheme = () => {
    //     if (activeTheme.palette.mode === 'light') setActiveTheme(darkTheme);
    //     else setActiveTheme(lightTheme);
    // };

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
