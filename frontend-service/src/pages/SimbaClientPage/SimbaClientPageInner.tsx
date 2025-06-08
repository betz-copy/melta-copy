import React, { lazy, Suspense, useEffect, useRef } from 'react';
import { useWorkspaceStore } from '../../stores/workspace';
import { AuthService } from '../../services/authService';
import { useQuery, useQueryClient } from 'react-query';
import { Route, Switch, useLocation, useRoute } from 'wouter';
import { useMatomo } from '@datapunt/matomo-tracker-react';
import { useScrollTrigger, debounce, Box } from '@mui/material';
import { environment } from '../../globals';
import { MainBox } from '../../Main.styled';
import ScrollToTop from '../../ScrollToTop';
import i18next from 'i18next';
import { getCurrentUserEntity } from '../../services/simbaService';
import { IEntityChildTemplateMapPopulated } from '../../interfaces/entityChildTemplates';
import { IKartoffelUser } from '../../interfaces/users';
import { Topbar } from './mainPage/Topbar';
import { useSimbaUserStore } from '../../stores/simbaUser';

const UserNotExistsPage = lazy(() => import('./userNotExistsPage'));
const SimbaMainPage = lazy(() => import('./mainPage'));
const ErrorPage = lazy(() => import('../ErrorPage'));

const SimbaClientPageInner: React.FC = () => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const setSimbaUser = useSimbaUserStore((state) => state.setSimbaUser);

    const usersInfoChildTemplateId = workspace.metadata.simba.usersInfoTemplateId;
    const user = AuthService.getUser();

    const queryClient = useQueryClient();

    const [location, navigate] = useLocation();
    const [entityMatch, entityParams] = useRoute('/entity/:entityId');

    const childTemplates = queryClient.getQueryData<IEntityChildTemplateMapPopulated>('getSimbaChildEntityTemplates')!;
    const usersInfoChildTemplate = childTemplates.get(usersInfoChildTemplateId);

    const { data: currentUserFromSimba } = useQuery({
        queryKey: ['searchEntitiesOfTemplate', usersInfoChildTemplate?.fatherTemplateId._id, user?.kartoffelId],
        queryFn: () => getCurrentUserEntity(usersInfoChildTemplate?.fatherTemplateId._id || '', user?.kartoffelId!),
        onError: () => {
            navigate('/simba/user-not-exists');
        },
    });

    const currentUser: IKartoffelUser = JSON.parse(currentUserFromSimba?.properties.full_name || '{}');

    useEffect(() => {
        if (currentUserFromSimba) {
            setSimbaUser({ ...currentUser }, currentUserFromSimba!);
        }
    }, [currentUser, setSimbaUser, currentUserFromSimba]);

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

    return (
        <>
            <MainBox
                ref={(ref: HTMLElement | null) => {
                    pageScrollTargetRef.current = ref;
                }}
                sx={{
                    backgroundImage: 'url(/icons/simba-logo-rtl.svg)',
                    backgroundSize: '90% 90%',
                    backgroundRepeat: 'no-repeat',
                    backgroundPositionX: 'center',
                    backgroundPositionY: 'bottom',
                }}
            >
                <Box>
                    <Suspense fallback={<div />}>
                        <Topbar currentUser={currentUser} />
                        <Switch>
                            <Route path="simba/test.mlt">
                                <SimbaMainPage />
                            </Route>
                            <Route path="simba/user-not-exists">
                                <UserNotExistsPage />
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

export default SimbaClientPageInner;
