import React, { useState, lazy, Suspense } from 'react';
import { CssBaseline, Box } from '@mui/material';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import { SideBar } from './common/sideBar';
import { MainBox } from './Main.styled';

const Home = lazy(() => import('./pages/Home'));
const Category = lazy(() => import('./pages/Category'));
const SystemManagement = lazy(() => import('./pages/SystemManagement'));
const PermissionsManagement = lazy(() => import('./pages/PermissionsManagement'));
const Unavailable = lazy(() => import('./pages/Unavailable'));
const Entity = lazy(() => import('./pages/Entity'));
const Graph = lazy(() => import('./pages/Entity/components/Graph'));

const cacheRtl = createCache({
    key: 'muirtl',
    stylisPlugins: [prefixer, rtlPlugin],
});

const Main = () => {
    const [open, setOpen] = useState(false);

    const toggleDrawer = () => {
        setOpen(!open);
    };

    return (
        <CacheProvider value={cacheRtl}>
            <Router>
                <Box display="flex">
                    <CssBaseline />
                    <SideBar toggleDrawer={toggleDrawer} isDrawerOpen={open} />
                    <MainBox>
                        <Box marginLeft={4} marginRight={4}>
                            <Suspense fallback={<div />}>
                                <Routes>
                                    <Route path="/system-management" element={<SystemManagement />} />
                                    <Route path="/permissions-management" element={<PermissionsManagement />} />
                                    <Route path="/unavailable" element={<Unavailable />} />
                                    <Route path="/category/:categoryId" element={<Category />} />
                                    <Route path="/graph/:entityId" element={<Home />} />
                                    <Route path="/entity/:entityId" element={<Entity />} />
                                    <Route path="/entity/:entityId/graph" element={<Graph />} />
                                    <Route path="/" element={<Home />} />
                                    <Route path="*" element={<h1>404</h1>} />
                                </Routes>
                            </Suspense>
                        </Box>
                    </MainBox>
                </Box>
            </Router>
        </CacheProvider>
    );
};
export default Main;
