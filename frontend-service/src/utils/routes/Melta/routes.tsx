import { Box, Button, useScrollTrigger } from '@mui/material';
import { useTour } from '@reactour/tour';
import i18next from 'i18next';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { Route, Switch, useLocation, useRoute } from 'wouter';
import { SideBar } from '../../../common/sideBar';
import { TopBar } from '../../../common/TopBar';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { MainBox } from '../../../Main.styled';
import ScrollToTop from '../../../ScrollToTop';
import { IPermissionsOfUser } from '../../../services/permissionsService';
import { useMeltaPlusStore } from '../../../stores/meltaPlus';
import { LocalStorage } from '../../localStorage';
import {
    CategoryProtectedRoute,
    EntityProtectedRoute,
    PermissionsManagementProtectedRoute,
    SystemManagementProtectedRoute,
} from '../ProtectedRoutes';

const GlobalSearch = lazy(() => import('../../../pages/GlobalSearch'));
const Category = lazy(() => import('../../../pages/Category'));
const SystemManagement = lazy(() => import('../../../pages/SystemManagement'));
const PermissionsManagement = lazy(() => import('../../../pages/PermissionsManagement'));
const RuleManagement = lazy(() => import('../../../pages/RuleManagement'));
const Gantts = lazy(() => import('../../../pages/Gantts'));
const GanttPage = lazy(() => import('../../../pages/Gantts/GanttPage'));
const ProcessInstancesPage = lazy(() => import('../../../pages/ProcessInstances'));
const Unavailable = lazy(() => import('../../../pages/Unavailable'));
const ErrorPage = lazy(() => import('../../../pages/ErrorPage'));
const Entity = lazy(() => import('../../../pages/Entity'));
const Graph = lazy(() => import('../../../pages/Graph'));
const Duplicate = lazy(() => import('../../../pages/Entity/components/DuplicateEntity'));

const FluidSimulation = lazy(() => import('../../../pages/MeltaPlus/FluidSimulation'));

export const MeltaRoutesInner: React.FC = () => {
    const [title, setTitle] = useState('');
    const [open, setOpen] = useState(false);

    const [_, navigate] = useLocation();

    const { setIsOpen, setCurrentStep } = useTour();

    const queryClient = useQueryClient();

    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const meltaPlus = useMeltaPlusStore((state) => state.meltaPlus);

    const [pageScrollTarget, setPageScrollTarget] = useState<HTMLElement | undefined>(undefined);
    const trigger = useScrollTrigger({ target: pageScrollTarget, disableHysteresis: true, threshold: 300 });

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
                                <SystemManagementProtectedRoute permissions={myPermissions}>
                                    <SystemManagement setTitle={setTitle} />
                                </SystemManagementProtectedRoute>
                            </Route>

                            <Route path="/permissions-management">
                                <TopBar title={title} />
                                <PermissionsManagementProtectedRoute permissions={myPermissions}>
                                    <PermissionsManagement setTitle={setTitle} />
                                </PermissionsManagementProtectedRoute>
                            </Route>

                            <Route path="/rule-management">
                                <TopBar title={title} />
                                <RuleManagement setTitle={setTitle} />
                            </Route>

                            <Route path="/gantts" nest>
                                <Route path="/">
                                    <TopBar title={title} />
                                    <Gantts setTitle={setTitle} />
                                </Route>
                                <Route path="/:ganttId">
                                    <GanttPage />
                                </Route>
                            </Route>

                            <Route path="/processes">
                                <ProcessInstancesPage />
                            </Route>

                            <Route path="/category/:categoryId">
                                <CategoryProtectedRoute permissions={myPermissions}>
                                    <Category />
                                </CategoryProtectedRoute>
                            </Route>

                            {/* TODO nest routes when nested params is implemented - https://github.com/molefrog/wouter/issues/409 */}
                            <Route path="/entity/:entityId">
                                <EntityProtectedRoute permissions={myPermissions} entityTemplates={entityTemplates}>
                                    <Entity />
                                </EntityProtectedRoute>
                            </Route>
                            <Route path="/entity/:entityId/graph">
                                <EntityProtectedRoute permissions={myPermissions} entityTemplates={entityTemplates}>
                                    <Graph />
                                </EntityProtectedRoute>
                            </Route>
                            <Route path="/entity/:entityId/duplicate">
                                <EntityProtectedRoute permissions={myPermissions} entityTemplates={entityTemplates}>
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
