import React, { useState, lazy, Suspense } from 'react';
import { CssBaseline, Box } from '@mui/material';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import { useQuery } from 'react-query';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { SideBar } from './common/sideBar';
import { MainBox } from './Main.styled';
import { getEntityTemplatesRequest } from './services/enitityTemplatesService';
import { getCategoriesRequest } from './services/categoriesService';
import { getMyPermissionsRequest } from './services/permissionsService';
import { getRelationshipTemplatesRequest } from './services/relationshipTemplatesService';

const Home = lazy(() => import('./pages/Home'));
const Category = lazy(() => import('./pages/Category'));
const SystemManagement = lazy(() => import('./pages/SystemManagement'));
const PermissionsManagement = lazy(() => import('./pages/PermissionsManagement'));
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
        initialData: [],
    });
    useQuery('getRelationshipTemplates', getRelationshipTemplatesRequest, {
        onError: () => {
            toast.error('failed to get relationshipTemplates');
        },
        initialData: [],
    });
    useQuery('getCategories', getCategoriesRequest, {
        onError: () => {
            toast.error('failed to get categories');
        },
        initialData: [],
    });

    useQuery('getMyPermissions', getMyPermissionsRequest, {
        onError: (error) => {
            console.log('failed loading my permissions:', error);
            toast.error(i18next.t('permissions.failedToLoadMyPermissions'));
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
