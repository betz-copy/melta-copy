import { WmtsEndpoint } from '@camptocamp/ogc-client';
import Bowser from 'bowser';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useLocation, useSearchParams } from 'wouter';
import { LoadingAnimation } from './common/LoadingAnimation';
import './css/index.css';
import './css/loading.css';
import { enableFallbackWithoutWorker } from '@camptocamp/ogc-client';
import { environment } from './globals';
import Main from './Main';
import { useMatomoInstance } from './matomo';
import MatomoWrapper, { MatomoTracker } from './matomoWrapper';
import ClientSidePage from './pages/ClientSidePage';
import ErrorPage from './pages/ErrorPage';
import { AuthService } from './services/authService';
import { BackendConfigState, getBackendConfigRequest } from './services/backendConfigService';
import { getMapLayer } from './services/mapService';
import { getMyUserRequest } from './services/userService';
import { getById, getWorkspaceHierarchyIds } from './services/workspacesService';
import { useDarkModeStore } from './stores/darkMode';
import { useUserStore } from './stores/user';
import { useWorkspaceStore } from './stores/workspace';
import { extractImageryUrl } from './utils/map';
import { getWorkspacePermissions } from './utils/permissions';

enableFallbackWithoutWorker();

const App: React.FC = () => {
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [isErrorMyUser, setIsErrorMyUser] = useState(false);
    const [isClientSide, setIsClientSide] = useState(false);

    const [location, navigate] = useLocation();
    const [searchParams] = useSearchParams();

    const matomoInstance = useMatomoInstance();
    const queryClient = useQueryClient();

    useEffect(() => {
        const browser = Bowser.getParser(window.navigator.userAgent);
        const isValidBrowser = browser.satisfies({
            chrome: `>=${environment.minimumSupportedChromeVersion}`,
        });

        if (!isValidBrowser) {
            toast.error(i18next.t('error.unsupportedChromeVersion'), { autoClose: false, theme: 'colored', style: { fontSize: 'large' } });
        }
    }, []);

    const currentUser = useUserStore((state) => state.user);
    const setUser = useUserStore((state) => state.setUser);

    const setDarkMode = useDarkModeStore((state) => state.setDarkMode);
    const workspaceStore = useWorkspaceStore((state) => state.workspace);

    useQuery('getMapLayers', () => undefined, { enabled: false });
    const { isError: isErrorBackendConfig } = useQuery<BackendConfigState>('getBackendConfig', getBackendConfigRequest, {
        onError: () => {
            toast.error(i18next.t('error.config'));
        },
        enabled: !isLoadingUser && !isErrorMyUser,
        onSuccess: async ({
            isOutsideDevelopment,
            getMapLayers: { url, params, layers, token, capabilitiesLinkSchema, cesiumLinkSchema, layerLinkTag, capabilitiesUrl },
        }) => {
            if (isOutsideDevelopment) return;

            const mapLayers = await Promise.all(
                layers?.map(async (layer) => {
                    const xml = await getMapLayer(url, params, layer.body, token);

                    const layerProvider = extractImageryUrl(
                        xml,
                        capabilitiesLinkSchema,
                        cesiumLinkSchema,
                        layer.name,
                        layer.displayName,
                        layer.type,
                        layerLinkTag,
                    );

                    const endpoint = await new WmtsEndpoint(`${capabilitiesUrl}?url=${layerProvider.url}`).isReady();
                    const wmtsLayer = endpoint.getLayerByName(layerProvider.id);

                    return { ...layerProvider, ...wmtsLayer };
                }),
            );

            queryClient.setQueryData('getMapLayers', mapLayers);
        },
    });

    const { data: hierarchyIds } = useQuery({
        queryKey: ['getWorkspaceHierarchyIds', workspaceStore._id],
        queryFn: () => getWorkspaceHierarchyIds(workspaceStore._id),
        enabled: Boolean(workspaceStore._id),
        initialData: [],
    });

    useEffect(() => {
        if (!workspaceStore._id) return;

        const handleWorkspace = async () => {
            const workspacePermissions = await getWorkspacePermissions(currentUser.permissions, hierarchyIds!);
            if (workspacePermissions) currentUser.permissions[workspaceStore._id] = workspacePermissions;

            if (currentUser.currentWorkspacePermissions !== currentUser.permissions[workspaceStore._id])
                setUser({ ...currentUser, currentWorkspacePermissions: currentUser.permissions[workspaceStore._id] });
        };

        handleWorkspace();
    }, [currentUser, hierarchyIds, setUser, workspaceStore]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: lol
    useEffect(() => {
        const initUser = async () => {
            const user = AuthService.getUser();

            const isUserUnauthorized = user?.id === environment.unauthorizedId;
            const isClientSide = user?.id === environment.clientSideId;

            if (!user || isUserUnauthorized) {
                if (isUserUnauthorized) setIsErrorMyUser(true);
                return;
            }

            if (isClientSide) {
                setIsClientSide(true);
                return;
            }

            try {
                const userFromDb = await getMyUserRequest();
                const workspaceIds = Object.keys(userFromDb.permissions);
                const adminWorkspaceIds = workspaceIds.filter((workspaceId) => userFromDb.permissions[workspaceId].admin);

                const isAdminRoot = (await Promise.all(adminWorkspaceIds.map((id) => getById(id)))).some((workspace) => workspace.path === '/');
                user.isRoot = isAdminRoot;
                setUser({ ...user, ...userFromDb });
                setDarkMode(userFromDb.preferences?.darkMode || false);

                if (workspaceIds.length === 1) {
                    const workspace = await getById(workspaceIds[0]);
                    const path = `${workspace.path}/${workspace.name}${workspace.type}`;
                    const searchParamsArray = [...searchParams.entries()];
                    const normalizedSearchParams = searchParamsArray.length
                        ? `?${searchParamsArray.map(([key, value]) => `${key}=${value}`).join('&')}`
                        : '';

                    if (workspace.name !== '' && workspace.path !== '/')
                        navigate(`${path}${location.length <= path.length ? '' : location.replace(path, '')}${normalizedSearchParams}`);
                }
            } catch {
                setIsErrorMyUser(true);
            }

            setIsLoadingUser(false);
        };

        initUser();
    }, [setUser, navigate, workspaceStore]);

    if (isClientSide) return <ClientSidePage />;

    if (isErrorMyUser) return <ErrorPage errorText={i18next.t('errorPage.noPermissions')} />;

    if (isLoadingUser) return <LoadingAnimation isLoading={isLoadingUser} />;

    if (!currentUser) return <span>unauthorized</span>;

    if (isErrorBackendConfig) return <ErrorPage errorText={i18next.t('errorPage.systemUnavailable')} />;

    return (
        <MatomoWrapper matomoInstance={matomoInstance! as MatomoTracker}>
            <Main />
        </MatomoWrapper>
    );
};

export default App;
