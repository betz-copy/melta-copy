import React, { useState, lazy, Suspense, useEffect } from 'react';
import { CssBaseline, Box, useScrollTrigger, Button } from '@mui/material';
import { matchPath, Route, Routes, useNavigate } from 'react-router-dom';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import { useQueryClient } from 'react-query';
import i18next from 'i18next';
import { useSelector } from 'react-redux';
import { useTour } from '@reactour/tour';
import { toast } from 'react-toastify';
import { SideBar } from './common/sideBar';
import { MainBox } from './Main.styled';
import { TopBar } from './common/TopBar';
import { IPermissionsOfUser } from './services/permissionsService';
import { IEntityTemplateMap } from './interfaces/entityTemplates';
import {
    PermissionsManagementProtectedRoute,
    SystemManagementProtectedRoute,
    EntityProtectedRoute,
    CategoryProtectedRoute,
} from './utils/ProtectedRoutes';
import ScrollToTop from './ScrollToTop';
import { RootState } from './store';
import { LocalStorage } from './utils/localStorage';

const GlobalSearch = lazy(() => import('./pages/GlobalSearch'));
const Category = lazy(() => import('./pages/Category'));
const SystemManagement = lazy(() => import('./pages/SystemManagement'));
const PermissionsManagement = lazy(() => import('./pages/PermissionsManagement'));
const RuleManagement = lazy(() => import('./pages/RuleManagement'));
const Gantts = lazy(() => import('./pages/Gantts'));
const GanttPage = lazy(() => import('./pages/Gantts/GanttPage'));
const ProcessInstancesPage = lazy(() => import('./pages/ProcessInstances'));
const Unavailable = lazy(() => import('./pages/Unavailable'));
const ErrorPage = lazy(() => import('./pages/ErrorPage'));
const Entity = lazy(() => import('./pages/Entity'));
const Graph = lazy(() => import('./pages/Graph'));
const Duplicate = lazy(() => import('./pages/Entity/components/DuplicateEntity'));

const FluidSimulation = lazy(() => import('./pages/MeltaPlus/FluidSimulation'));

const cacheRtl = createCache({
    key: 'muirtl',
    stylisPlugins: [prefixer, rtlPlugin],
});

const Main = () => {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState('');
    const navigate = useNavigate();
    const { setIsOpen, setCurrentStep } = useTour();

    const [pageScrollTarget, setPageScrollTarget] = useState<HTMLElement | undefined>(undefined);
    const trigger = useScrollTrigger({ target: pageScrollTarget, disableHysteresis: true, threshold: 300 });

    const queryClient = useQueryClient();

    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const meltaPlus = useSelector((state: RootState) => state.meltaPlus);

    const toggleDrawer = () => {
        setOpen(!open);
    };

    useEffect(() => {
        const didTour = LocalStorage.get<boolean>('didTour');

        if (!didTour) {
            toast.info(
                <>
                    <span>{i18next.t('tourText.forTour')}</span>
                    <Button
                        variant="contained"
                        onClick={() => {
                            LocalStorage.set('didTour', true);
                            setIsOpen(true);
                            setCurrentStep(0);
                            navigate('/?search=&viewMode=templates-tables-view');
                        }}
                        sx={{ marginRight: '10px' }}
                    >
                        {i18next.t('tourText.pressHere')}
                    </Button>
                </>,
                {
                    autoClose: false,
                    onClose: () => LocalStorage.set('didTour', true),
                },
            );
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <CacheProvider value={cacheRtl}>
            <Box display="flex">
                <CssBaseline />
                <SideBar toggleDrawer={toggleDrawer} isDrawerOpen={open} />
                <MainBox
                    id="main-box"
                    ref={(ref) => {
                        if (ref) setPageScrollTarget(ref as HTMLElement);
                    }}
                    style={{ overflowY: matchPath('/entity/:entityId/graph', window.location.pathname) ? 'hidden' : 'auto' }}
                >
                    <Box>
                        <Suspense fallback={<div />}>
                            <Routes>
                                <Route
                                    path="/system-management"
                                    element={
                                        <>
                                            <TopBar title={title} />
                                            <SystemManagementProtectedRoute permissions={myPermissions}>
                                                <SystemManagement setTitle={setTitle} />
                                            </SystemManagementProtectedRoute>
                                        </>
                                    }
                                />
                                <Route
                                    path="/permissions-management"
                                    element={
                                        <>
                                            <TopBar title={title} />
                                            <PermissionsManagementProtectedRoute permissions={myPermissions}>
                                                <PermissionsManagement setTitle={setTitle} />
                                            </PermissionsManagementProtectedRoute>
                                        </>
                                    }
                                />
                                <Route
                                    path="/rule-management"
                                    element={
                                        <>
                                            <TopBar title={title} />
                                            <RuleManagement setTitle={setTitle} />
                                        </>
                                    }
                                />
                                <Route
                                    path="/gantts"
                                    element={
                                        <>
                                            <TopBar title={title} />
                                            <Gantts setTitle={setTitle} />
                                        </>
                                    }
                                />
                                <Route path="/gantts/:ganttId" element={<GanttPage />} />
                                <Route path="/processes" element={<ProcessInstancesPage />} />
                                <Route path="/unavailable" element={<Unavailable setTitle={setTitle} />} />
                                <Route
                                    path="/category/:categoryId"
                                    element={
                                        <CategoryProtectedRoute permissions={myPermissions}>
                                            <Category />
                                        </CategoryProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/entity/:entityId"
                                    element={
                                        <EntityProtectedRoute permissions={myPermissions} entityTemplates={entityTemplates}>
                                            <Entity />
                                        </EntityProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/entity/:entityId/graph"
                                    element={
                                        <EntityProtectedRoute permissions={myPermissions} entityTemplates={entityTemplates}>
                                            <Graph />
                                        </EntityProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/entity/:entityId/duplicate"
                                    element={
                                        <EntityProtectedRoute permissions={myPermissions} entityTemplates={entityTemplates}>
                                            <Duplicate />
                                        </EntityProtectedRoute>
                                    }
                                />
                                <Route path="/" element={<GlobalSearch />} />
                                <Route path="*" element={<ErrorPage errorText={i18next.t('errorPage.reachedTheWrongPage')} />} />

                                {meltaPlus && <Route path="/fluid-simulation" element={<FluidSimulation setTitle={setTitle} />} />}
                            </Routes>
                        </Suspense>
                    </Box>
                    <ScrollToTop fadeInTrigger={trigger} />
                </MainBox>
            </Box>
        </CacheProvider>
    );
};
export default Main;
