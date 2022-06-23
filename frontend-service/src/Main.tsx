import React, { useState, lazy, Suspense, useRef } from 'react';
import { CssBaseline, Box, useScrollTrigger } from '@mui/material';
import { Route, Routes } from 'react-router-dom';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import { useQueryClient } from 'react-query';
import i18next from 'i18next';
import { SideBar } from './common/sideBar';
import { MainBox } from './Main.styled';
import { TopBar } from './common/TopBar';
import { IPermissionsOfUser } from './services/permissionsService';
import { IMongoEntityTemplatePopulated } from './interfaces/entityTemplates';
import {
    PermissionsManagementProtectedRoute,
    SystemManagementProtectedRoute,
    EntityProtectedRoute,
    CategoryProtectedRoute,
} from './utils/ProtectedRoutes';
import ScrollToTop from './ScrollToTop';

const GlobalSearch = lazy(() => import('./pages/GlobalSearch'));
const Category = lazy(() => import('./pages/Category'));
const SystemManagement = lazy(() => import('./pages/SystemManagement'));
const PermissionsManagement = lazy(() => import('./pages/PermissionsManagement'));
const Unavailable = lazy(() => import('./pages/Unavailable'));
const ErrorPage = lazy(() => import('./pages/ErrorPage'));
const Entity = lazy(() => import('./pages/Entity'));
const Graph = lazy(() => import('./pages/Entity/components/Graph'));

const cacheRtl = createCache({
    key: 'muirtl',
    stylisPlugins: [prefixer, rtlPlugin],
});

const Main = () => {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState('');

    const [pageScrollTarget, setPageScrollTarget] = useState<HTMLElement | undefined>(undefined);
    const trigger = useScrollTrigger({ target: pageScrollTarget, disableHysteresis: true, threshold: 300 });
    const topBarRef = useRef<HTMLDivElement>(null);

    const queryClient = useQueryClient();

    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;
    const entityTemplates = queryClient.getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates')!;

    const toggleDrawer = () => {
        setOpen(!open);
    };

    return (
        <CacheProvider value={cacheRtl}>
            <Box display="flex">
                <CssBaseline />
                <SideBar toggleDrawer={toggleDrawer} isDrawerOpen={open} />
                <MainBox
                    ref={(ref) => {
                        if (ref) setPageScrollTarget(ref as HTMLElement);
                    }}
                >
                    <TopBar ref={topBarRef} title={title} />
                    <Box>
                        <Suspense fallback={<div />}>
                            <Routes>
                                <Route
                                    path="/system-management"
                                    element={
                                        <SystemManagementProtectedRoute permissions={myPermissions}>
                                            <SystemManagement setTitle={setTitle} />
                                        </SystemManagementProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/permissions-management"
                                    element={
                                        <PermissionsManagementProtectedRoute permissions={myPermissions}>
                                            <PermissionsManagement setTitle={setTitle} />
                                        </PermissionsManagementProtectedRoute>
                                    }
                                />
                                <Route path="/unavailable" element={<Unavailable setTitle={setTitle} />} />
                                <Route
                                    path="/category/:categoryId"
                                    element={
                                        <CategoryProtectedRoute permissions={myPermissions}>
                                            <Category setTitle={setTitle} />
                                        </CategoryProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/entity/:entityId"
                                    element={
                                        <EntityProtectedRoute permissions={myPermissions} entityTemplates={entityTemplates}>
                                            <Entity setTitle={setTitle} />
                                        </EntityProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/entity/:entityId/graph"
                                    element={
                                        <EntityProtectedRoute permissions={myPermissions} entityTemplates={entityTemplates}>
                                            <Graph setTitle={setTitle} />
                                        </EntityProtectedRoute>
                                    }
                                />
                                <Route path="/" element={<GlobalSearch setTitle={setTitle} />} />
                                <Route path="*" element={<ErrorPage setTitle={setTitle} errorText={i18next.t('errorPage.reachedTheWrongPage')} />} />
                            </Routes>
                        </Suspense>
                    </Box>
                    <ScrollToTop fadeInTrigger={trigger} scrollToElementRef={topBarRef} />
                </MainBox>
            </Box>
        </CacheProvider>
    );
};
export default Main;
