import { Box, Button, debounce, useScrollTrigger } from '@mui/material';
import { useTour } from '@reactour/tour';
import i18next from 'i18next';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { Route, Switch, useLocation, useRoute } from 'wouter';
import { SideBar } from '../../common/sideBar';
import { TopBar } from '../../common/TopBar';
import { IEntityTemplateMap } from '../../interfaces/entityTemplates';
import { MainBox } from '../../Main.styled';
import ScrollToTop from '../../ScrollToTop';
import { useMeltaPlusStore } from '../../stores/meltaPlus';
import { useUserStore } from '../../stores/user';
import { LocalStorage } from '../../utils/localStorage';
import {
    CategoryProtectedRoute,
    EntityProtectedRoute,
    PermissionsManagementProtectedRoute,
    SystemManagementProtectedRoute,
} from '../../utils/ProtectedRoutes';

const GlobalSearch = lazy(() => import('../GlobalSearch'));
const Category = lazy(() => import('../Category'));
const SystemManagement = lazy(() => import('../SystemManagement'));
const PermissionsManagement = lazy(() => import('../PermissionsManagement'));
const RuleManagement = lazy(() => import('../RuleManagement'));
const Gantts = lazy(() => import('../Gantts'));
const GanttPage = lazy(() => import('../Gantts/GanttPage'));
const IFrames = lazy(() => import('../IFrames'));
const IFramePage = lazy(() => import('../IFrames/IFramePage'));
const ProcessInstancesPage = lazy(() => import('../ProcessInstances'));
const Unavailable = lazy(() => import('../Unavailable'));
const ErrorPage = lazy(() => import('../ErrorPage'));
const Entity = lazy(() => import('../Entity'));
const Graph = lazy(() => import('../Graph'));
const Duplicate = lazy(() => import('../Entity/components/DuplicateEntity'));

const FluidSimulation = lazy(() => import('../MeltaPlus/FluidSimulation'));

export const MeltaRoutesInner: React.FC = () => {
    const [title, setTitle] = useState('');
    const [open, setOpen] = useState(false);

    const [_, navigate] = useLocation();

    const { setIsOpen, setCurrentStep } = useTour();

    const currentUser = useUserStore((state) => state.user);

    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const meltaPlus = useMeltaPlusStore((state) => state.meltaPlus);

    const [pageScrollTarget, setPageScrollTarget] = useState<HTMLElement | undefined>(undefined);
    const trigger = useScrollTrigger({ target: pageScrollTarget, disableHysteresis: true, threshold: 300 });

    useEffect(() => {
        const savedScrollPosition = sessionStorage.getItem(`pageScrollPosition-${window.location.pathname}`);

        if (savedScrollPosition && pageScrollTarget) {
            setTimeout(() => {
                requestAnimationFrame(() => {
                    pageScrollTarget.scrollTo({
                        top: parseInt(savedScrollPosition, 10),
                        behavior: 'smooth',
                    });
                });
            }, 150);
        }

        const handleScroll = debounce(() => {
            if (pageScrollTarget) {
                sessionStorage.setItem(`pageScrollPosition-${window.location.pathname}`, pageScrollTarget.scrollTop.toString());
            }
        }, 300);

        if (pageScrollTarget) {
            pageScrollTarget.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (pageScrollTarget) {
                pageScrollTarget.removeEventListener('scroll', handleScroll);
            }
        };
    }, [pageScrollTarget, window.location.pathname]);

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
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const [match] = useRoute('/entity/:entityId/graph');

    return (
        <>
            <SideBar toggleDrawer={() => setOpen(!open)} isDrawerOpen={open} />
            <MainBox
                id="main-box"
                ref={(ref) => {
                    if (ref) setPageScrollTarget(ref as HTMLElement);
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

                            <Route path="/">
                                <GlobalSearch />
                            </Route>

                            <Route path="*">
                                <ErrorPage errorText={i18next.t('errorPage.reachedTheWrongPage')} />
                            </Route>
                        </Switch>
                    </Suspense>

                    <ScrollToTop fadeInTrigger={trigger} />
                </Box>
            </MainBox>
        </>
    );
};
