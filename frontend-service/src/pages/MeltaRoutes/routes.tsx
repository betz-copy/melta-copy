/* eslint-disable react-hooks/exhaustive-deps */
import { useMatomo } from '@datapunt/matomo-tracker-react';
import { Box, Button, debounce, useScrollTrigger } from '@mui/material';
import { useTour } from '@reactour/tour';
import i18next from 'i18next';
import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { Redirect, Route, Switch, useLocation, useRoute } from 'wouter';
import { SideBar } from '../../common/sideBar';
import { TopBar } from '../../common/TopBar';
import { environment } from '../../globals';
import { DashboardItemType } from '../../interfaces/dashboard';
import { IEntityTemplateMap } from '../../interfaces/entityTemplates';
import { MainBox } from '../../Main.styled';
import { MeltaUpdates } from '../../MeltaUpdates';
import ScrollToTop from '../../ScrollToTop';
import { BackendConfigState } from '../../services/backendConfigService';
import { useMeltaPlusStore } from '../../stores/meltaPlus';
import { useUserStore } from '../../stores/user';
import { useWorkspaceStore } from '../../stores/workspace';
import { LocalStorage } from '../../utils/localStorage';
import {
    CategoryProtectedRoute,
    DashboardProtectedRoute,
    EntityProtectedRoute,
    PermissionsManagementProtectedRoute,
    SystemManagementProtectedRoute,
} from '../../utils/ProtectedRoutes';

const GlobalSearch = lazy(() => import('../GlobalSearch'));
const Dashboard = lazy(() => import('../Dashboard'));
const Category = lazy(() => import('../Category'));
const Table = lazy(() => import('../Dashboard/DashboardItemDetails/Table'));
const SystemManagement = lazy(() => import('../SystemManagement'));
const PermissionsManagement = lazy(() => import('../PermissionsManagement'));
const RuleManagement = lazy(() => import('../RuleManagement'));
const Charts = lazy(() => import('../Charts'));
const DashboardIframe = lazy(() => import('../Dashboard/DashboardItemDetails/Iframe'));
const Chart = lazy(() => import('../Dashboard/DashboardItemDetails/Chart'));
const Gantts = lazy(() => import('../Gantts'));
const GanttPage = lazy(() => import('../Gantts/GanttPage'));
const IFrames = lazy(() => import('../IFrames'));
const IFramePage = lazy(() => import('../IFrames/IFramePage'));
const ProcessInstancesPage = lazy(() => import('../ProcessInstances'));
const Unavailable = lazy(() => import('../Unavailable'));
const ErrorPage = lazy(() => import('../ErrorPage'));
const Entity = lazy(() => import('../Entity'));
const Graph = lazy(() => import('../Graph'));
const Map = lazy(() => import('../Map/mapPage'));
const Duplicate = lazy(() => import('../Entity/components/DuplicateEntity'));

const FluidSimulation = lazy(() => import('../MeltaPlus/FluidSimulation'));

const {
    searchPath,
    dashboard: { dashboardPath },
} = environment;

export const MeltaRoutesInner: React.FC = () => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const { isDrawerOpen, isDashboardHomePage } = workspace.metadata;
    const [title, setTitle] = useState('');
    const [open, setOpen] = useState(isDrawerOpen);
    const [openMeltaUpdates, setOpenMeltaUpdates] = useState(false);

    const [location, navigate] = useLocation();
    const [entityMatch, entityParams] = useRoute('/entity/:entityId');
    const [match] = useRoute('/entity/:entityId/graph');

    const { setIsOpen, setCurrentStep } = useTour();

    const currentUser = useUserStore((state) => state.user);

    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const config = queryClient.getQueryData<BackendConfigState>('getBackendConfig');

    const meltaPlus = useMeltaPlusStore((state) => state.meltaPlus);

    const pageScrollTargetRef = useRef<HTMLElement | null>(null);
    const trigger = useScrollTrigger({ target: pageScrollTargetRef.current ?? undefined, disableHysteresis: true, threshold: 300 });

    const { trackPageView } = useMatomo();

    useEffect(() => {
        const savedScrollPosition = sessionStorage.getItem(`pageScrollPosition-${location}`);

        if (savedScrollPosition && pageScrollTargetRef.current) {
            const savedScrollPositionNumber = parseInt(savedScrollPosition, 10);
            const pageScrollTarget = pageScrollTargetRef.current;
            let attempts = 0;
            const maxAttempts = 50;

            const tryScrollToSavedPosition = () => {
                if (pageScrollTarget.scrollHeight >= savedScrollPositionNumber + pageScrollTarget.clientHeight) {
                    pageScrollTarget.scrollTo({
                        top: savedScrollPositionNumber,
                        behavior: 'smooth',
                    });
                } else if (attempts < maxAttempts) {
                    attempts += 1;
                    setTimeout(tryScrollToSavedPosition, environment.attemptInterval);
                }
            };
            tryScrollToSavedPosition();
        }

        const handleScroll = debounce(() => {
            if (pageScrollTargetRef.current) {
                sessionStorage.setItem(`pageScrollPosition-${location}`, pageScrollTargetRef.current.scrollTop.toString());
            }
        }, 300);

        const pageScrollTarget = pageScrollTargetRef.current;

        if (pageScrollTarget) {
            pageScrollTarget.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (pageScrollTarget) {
                pageScrollTarget.removeEventListener('scroll', handleScroll);
            }
        };
    }, [location]);

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
                            navigate('?search=&viewMode=templates-tables-view');
                        }}
                        sx={{ marginRight: '10px' }}
                    >
                        {i18next.t('tourText.pressHere')}
                    </Button>
                </>,
                { autoClose: false, onClose: () => LocalStorage.set('didTour', true) },
            );
        }
    }, []);

    useEffect(() => {
        const meltaUpdatesShown = LocalStorage.get<string>(environment.meltaUpdatesShown);

        if (config?.meltaUpdates && meltaUpdatesShown !== JSON.stringify(config.meltaUpdates)) setOpenMeltaUpdates(true);
    }, []);

    const handleClose = () => {
        setOpenMeltaUpdates(false);
        LocalStorage.set(environment.meltaUpdatesShown, JSON.stringify(config?.meltaUpdates));
    };

    useEffect(() => {
        if (entityMatch && entityParams) {
            const { entityId } = entityParams;

            trackPageView({
                documentTitle: `Entity Page - ${entityId}`,
                href: window.location.href,
            });
        }
    }, [entityMatch, entityParams, trackPageView]);

    return (
        <>
            <SideBar toggleDrawer={() => setOpen(!open)} isDrawerOpen={open} />
            <MainBox
                id="main-box"
                ref={(ref: HTMLElement | null) => {
                    pageScrollTargetRef.current = ref;
                }}
                style={{ overflowY: match ? 'hidden' : 'auto', overflowAnchor: 'none' }}
            >
                <Box>
                    <Suspense fallback={<div />}>
                        <Switch>
                            <Route path="/system-management">
                                <TopBar title={title} />
                                <SystemManagementProtectedRoute permissions={currentUser.currentWorkspacePermissions}>
                                    <SystemManagement setTitle={setTitle} />
                                </SystemManagementProtectedRoute>
                            </Route>

                            <Route path="/permissions-management">
                                <TopBar title={title} />
                                <PermissionsManagementProtectedRoute permissions={currentUser.currentWorkspacePermissions}>
                                    <PermissionsManagement setTitle={setTitle} />
                                </PermissionsManagementProtectedRoute>
                            </Route>

                            <Route path="/rule-management/:breachType?/:ruleBreachId?">
                                <TopBar title={title} />
                                <RuleManagement setTitle={setTitle} />
                            </Route>

                            <Route path="/map">
                                <Map />
                            </Route>

                            <Route path="/charts/:templateId?/:chartId?/chart">
                                <DashboardProtectedRoute
                                    permissions={currentUser.currentWorkspacePermissions}
                                    dashboardType={DashboardItemType.Chart}
                                >
                                    <Chart />
                                </DashboardProtectedRoute>
                            </Route>

                            <Route path="/charts/:templateId">
                                <DashboardProtectedRoute
                                    permissions={currentUser.currentWorkspacePermissions}
                                    dashboardType={DashboardItemType.Chart}
                                >
                                    <Charts />
                                </DashboardProtectedRoute>
                            </Route>

                            <Route path="/table/:tableId?">
                                <DashboardProtectedRoute
                                    permissions={currentUser.currentWorkspacePermissions}
                                    dashboardType={DashboardItemType.Table}
                                >
                                    <Table />
                                </DashboardProtectedRoute>
                            </Route>

                            <Route path="/iframe/:iframeId?">
                                <DashboardProtectedRoute
                                    permissions={currentUser.currentWorkspacePermissions}
                                    dashboardType={DashboardItemType.Iframe}
                                >
                                    <DashboardIframe />
                                </DashboardProtectedRoute>
                            </Route>

                            <Route path="/gantts">
                                <TopBar title={title} />
                                <Gantts setTitle={setTitle} />
                            </Route>

                            <Route path="/gantts/:ganttId">
                                <GanttPage />
                            </Route>
                            <Route path="/iframes">
                                <IFrames isSideBarOpen={open} />
                            </Route>
                            <Route path="/iframes/:iFrameId">
                                <IFramePage />
                            </Route>

                            <Route path="/processes">
                                <ProcessInstancesPage />
                            </Route>

                            <Route path="/category/:categoryId">
                                <CategoryProtectedRoute permissions={currentUser.currentWorkspacePermissions}>
                                    <Category />
                                </CategoryProtectedRoute>
                            </Route>

                            <Route path="/entity/:entityId">
                                <EntityProtectedRoute permissions={currentUser.currentWorkspacePermissions} entityTemplates={entityTemplates}>
                                    <Entity />
                                </EntityProtectedRoute>
                            </Route>

                            <Route path="/entity/:entityId/graph">
                                <EntityProtectedRoute permissions={currentUser.currentWorkspacePermissions} entityTemplates={entityTemplates}>
                                    <Graph />
                                </EntityProtectedRoute>
                            </Route>

                            <Route path="/entity/:entityId/:templateId">
                                <EntityProtectedRoute permissions={currentUser.currentWorkspacePermissions} entityTemplates={entityTemplates}>
                                    <Entity />
                                </EntityProtectedRoute>
                            </Route>

                            <Route path="/entity/:entityId/duplicate">
                                <EntityProtectedRoute permissions={currentUser.currentWorkspacePermissions} entityTemplates={entityTemplates}>
                                    <Duplicate />
                                </EntityProtectedRoute>
                            </Route>

                            {meltaPlus && (
                                <Route path="/fluid-simulation">
                                    <FluidSimulation setTitle={setTitle} />
                                </Route>
                            )}

                            <Route path="/unavailable">
                                <Unavailable setTitle={setTitle} />
                            </Route>

                            <Route path={dashboardPath}>
                                <Dashboard />
                            </Route>

                            <Route path={searchPath}>
                                <GlobalSearch />
                            </Route>

                            <Route path="/">
                                <Redirect to={isDashboardHomePage ? dashboardPath : searchPath} />
                            </Route>

                            <Route path="*">
                                <ErrorPage errorText={i18next.t('errorPage.reachedTheWrongPage')} />
                            </Route>
                        </Switch>
                    </Suspense>

                    <ScrollToTop fadeInTrigger={trigger} />
                </Box>
            </MainBox>
            {config?.meltaUpdates && (
                <MeltaUpdates
                    open={openMeltaUpdates}
                    handleClose={handleClose}
                    meltaUpdates={config?.meltaUpdates}
                    titleDescription={config?.meltaUpdatesDescription}
                />
            )}
        </>
    );
};
