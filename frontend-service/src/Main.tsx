import React, { useState, lazy, Suspense } from 'react';
import { CssBaseline, Box, Toolbar } from '@mui/material';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import { useQuery } from 'react-query';
import { toast } from 'react-toastify';
import { Header } from './common/Header';
import { SideBar } from './common/SideBar';
import { MainBox } from './Main.styled';
import { getEntityTemplatesRequest } from './services/enitityTemplatesService';
import { getCategoriesRequest } from './services/categoriesService';

const Home = lazy(() => import('./pages/Home'));
const Category = lazy(() => import('./pages/Category'));
const SystemManagement = lazy(() => import('./pages/SystemManagement'));
const Unavailable = lazy(() => import('./pages/Unavailable'));

const cacheRtl = createCache({
    key: 'muirtl',
    stylisPlugins: [prefixer, rtlPlugin],
});

const Main = () => {
    const [open, setOpen] = useState(false);
    useQuery('getEntityTemplates', getEntityTemplatesRequest, {
        onError: () => {
            toast.error('failed to get entityTemplates');
        },
    });
    useQuery('getCategories', getCategoriesRequest, {
        onError: () => {
            toast.error('failed to get categories');
        },
    });

    const toggleDrawer = () => {
        setOpen(!open);
    };

    return (
        <CacheProvider value={cacheRtl}>
            <Router>
                <Box display="flex">
                    <CssBaseline />
                    <Header toggleDrawer={toggleDrawer} isDrawerOpen={open} />
                    <SideBar toggleDrawer={toggleDrawer} isDrawerOpen={open} />
                    <MainBox>
                        <Toolbar />
                        <Box>
                            <Suspense fallback={<div />}>
                                <Routes>
                                    <Route path="/system-management" element={<SystemManagement />} />
                                    <Route path="/unavailable" element={<Unavailable />} />
                                    <Route path="/category" element={<Category />} />
                                    <Route path="/" element={<Home />} />
                                    <Route path="*" element={<Home />} />
                                    <Route path="/graph/:instanceId" element={<Home />} />
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
