import { useMatomo } from '@datapunt/matomo-tracker-react';
import { Box, debounce, Grid, useScrollTrigger } from '@mui/material';
import i18next from 'i18next';
import React, { lazy, Suspense, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { Route, Switch, useLocation, useRoute } from 'wouter';
import { LoadingAnimation } from '../../common/LoadingAnimation';
import { environment } from '../../globals';
import { IChildTemplateMapPopulated } from '../../interfaces/childTemplates';
import { IKartoffelUser } from '../../interfaces/users';
import { MainBox } from '../../Main.styled';
import ScrollToTop from '../../ScrollToTop';
import { AuthService } from '../../services/authService';
import { getCurrentUserEntity } from '../../services/clientSideService';
import { useClientSideUserStore } from '../../stores/clientSideUser';
import { useWorkspaceStore } from '../../stores/workspace';
import { Topbar } from './mainPage/Topbar';

const UserNotExistsPage = lazy(() => import('./userNotExistsPage'));
const ClientSideMainPage = lazy(() => import('./mainPage'));
const ErrorPage = lazy(() => import('../ErrorPage'));
const ClientSideEntityPage = lazy(() => import('./entityPage'));

const ClientSidePageInner: React.FC = () => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const setClientSideUser = useClientSideUserStore((state) => state.setClientSideUser);

    const { usersInfoChildTemplateId, clientSideWorkspaceName } = workspace.metadata.clientSide;
    const user = AuthService.getUser();

    const queryClient = useQueryClient();

    const [location, navigate] = useLocation();
    const [entityMatch, entityParams] = useRoute('/entity/:entityId');

    const childTemplates = queryClient.getQueryData<IChildTemplateMapPopulated>('getClientSideChildEntityTemplates')!;
    const usersInfoChildTemplate = childTemplates.get(usersInfoChildTemplateId);

    const {
        isLoading,
        data: currentUserFromClientSide,
        isError,
    } = useQuery({
        queryKey: ['searchEntitiesOfTemplate', usersInfoChildTemplate?.parentTemplate._id, user?.kartoffelId],
        queryFn: () => getCurrentUserEntity(usersInfoChildTemplate?.parentTemplate._id || '', user?.kartoffelId!),
        onError: () => {
            navigate('/client-side/user-not-exists');
        },
    });

    const currentUser: IKartoffelUser = JSON.parse(currentUserFromClientSide?.properties.full_name || '{}');

    useEffect(() => {
        if (currentUserFromClientSide) {
            setClientSideUser({ ...currentUser }, currentUserFromClientSide!);
        }
    }, [currentUser, setClientSideUser, currentUserFromClientSide]);

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
        if (entityMatch && entityParams) {
            const { entityId } = entityParams;

            trackPageView({
                documentTitle: `Entity Page - ${entityId}`,
                href: window.location.href,
            });
        }
    }, [entityMatch, entityParams, trackPageView]);

    if (isLoading)
        return (
            <Grid width="100%" justifyContent="center">
                <LoadingAnimation isLoading={isLoading} />;
            </Grid>
        );

    return (
        <>
            <MainBox
                ref={(ref: HTMLElement | null) => {
                    pageScrollTargetRef.current = ref;
                }}
                sx={{
                    backgroundImage: `url(/clientSide/${clientSideWorkspaceName}/logo-rtl.svg)`,
                    backgroundSize: '90% 90%',
                    backgroundRepeat: 'no-repeat',
                    backgroundPositionX: 'center',
                    backgroundPositionY: 'bottom',
                }}
                style={{ overflowY: 'auto', overflowAnchor: 'none' }}
            >
                <Box>
                    <Suspense fallback={<div />}>
                        {!isError && <Topbar currentUser={currentUser} />}
                        <Switch>
                            <Route path="client-side/user-not-exists">
                                <UserNotExistsPage />
                            </Route>
                            <Route path="simba/test.mlt">
                                <ClientSideMainPage />
                            </Route>
                            <Route path="client-side/entity/:entityId">
                                <ClientSideEntityPage />
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

export default ClientSidePageInner;
