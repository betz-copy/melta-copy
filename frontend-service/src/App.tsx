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
import { config } from 'bignumber.js';
import { XMLParser } from 'fast-xml-parser';
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

const App: React.FC = () => {
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [isErrorMyUser, setIsErrorMyUser] = useState(false);
    const [isClientSide, setIsClientSide] = useState(false);

    const [location, navigate] = useLocation();
    const [searchParams] = useSearchParams();

    const matomoInstance = useMatomoInstance();
    const queryClient = useQueryClient();
    const xmlParser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
    });

    useEffect(() => {
        const browser = Bowser.getParser(window.navigator.userAgent);
        const isValidBrowser = browser.satisfies({
            chrome: `>=${environment.minimumSupportedChromeVersion}`,
        });

        if (!isValidBrowser) {
            toast.error(i18next.t('error.unsupportedChromeVersion'), { autoClose: false, theme: 'colored', style: { fontSize: 'large' } });
        }
        const xml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- pycsw 3.0-dev -->
<csw:GetRecordsResponse xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dct="http://purl.org/dc/terms/" xmlns:gmd="http://www.isotc211.org/2005/gmd" xmlns:gml="http://www.opengis.net/gml" xmlns:gml32="http://www.opengis.net/gml/3.2" xmlns:ows="http://www.opengis.net/ows" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.0.2" xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd">
    <csw:SearchStatus timestamp="2025-12-28T09:30:42Z"/>
    <csw:SearchResults numberOfRecordsMatched="12" numberOfRecordsReturned="10" nextRecord="11" recordSchema="http://www.opengis.net/cat/csw/2.0.2" elementSet="summary">
        <csw:SummaryRecord>
            <dc:identifier>urn:uuid:19887a8a-f6b0-4a63-ae56-7fba0e17801f</dc:identifier>
            <dc:title>Lorem ipsum</dc:title>
            <dc:type>http://purl.org/dc/dcmitype/Image</dc:type>
            <dc:subject>Tourism--Greece</dc:subject>
            <dc:format>image/svg+xml</dc:format>
            <dct:abstract>Quisque lacus diam, placerat mollis, pharetra in, commodo sed, augue. Duis iaculis arcu vel arcu.</dct:abstract>
        </csw:SummaryRecord>
        <csw:SummaryRecord>
            <dc:identifier>urn:uuid:1ef30a8b-876d-4828-9246-c37ab4510bbd</dc:identifier>
            <dc:title></dc:title>
            <dc:type>http://purl.org/dc/dcmitype/Service</dc:type>
            <dct:abstract>Proin sit amet justo. In justo. Aenean adipiscing nulla id tellus.</dct:abstract>
            <ows:BoundingBox crs="urn:x-ogc:def:crs:EPSG:6.11:4326" dimensions="2">
                <ows:LowerCorner>60.04 13.75</ows:LowerCorner>
                <ows:UpperCorner>68.41 17.92</ows:UpperCorner>
            </ows:BoundingBox>
        </csw:SummaryRecord>
        <csw:SummaryRecord>
            <dc:identifier>urn:uuid:66ae76b7-54ba-489b-a582-0f0633d96493</dc:identifier>
            <dc:title>Maecenas enim</dc:title>
            <dc:type>http://purl.org/dc/dcmitype/Text</dc:type>
            <dc:subject>Marine sediments</dc:subject>
            <dc:format>application/xhtml+xml</dc:format>
            <dct:abstract>Pellentesque tempus magna non sapien fringilla blandit.</dct:abstract>
        </csw:SummaryRecord>
        <csw:SummaryRecord>
            <dc:identifier>urn:uuid:6a3de50b-fa66-4b58-a0e6-ca146fdd18d4</dc:identifier>
            <dc:title>Ut facilisis justo ut lacus</dc:title>
            <dc:type>http://purl.org/dc/dcmitype/Service</dc:type>
            <dc:subject>Vegetation</dc:subject>
            <dc:relation>urn:uuid:94bc9c83-97f6-4b40-9eb8-a8e8787a5c63</dc:relation>
        </csw:SummaryRecord>
        <csw:SummaryRecord>
            <dc:identifier>urn:uuid:784e2afd-a9fd-44a6-9a92-a3848371c8ec</dc:identifier>
            <dc:title>Aliquam fermentum purus quis arcu</dc:title>
            <dc:type>http://purl.org/dc/dcmitype/Text</dc:type>
            <dc:subject>Hydrography--Dictionaries</dc:subject>
            <dc:format>application/pdf</dc:format>
            <dct:abstract>Vestibulum quis ipsum sit amet metus imperdiet vehicula. Nulla scelerisque cursus mi.</dct:abstract>
        </csw:SummaryRecord>
        <csw:SummaryRecord>
            <dc:identifier>urn:uuid:829babb0-b2f1-49e1-8cd5-7b489fe71a1e</dc:identifier>
            <dc:title>Vestibulum massa purus</dc:title>
            <dc:type>http://purl.org/dc/dcmitype/Image</dc:type>
            <dc:format>image/jp2</dc:format>
            <dc:relation>urn:uuid:9a669547-b69b-469f-a11f-2d875366bbdc</dc:relation>
        </csw:SummaryRecord>
        <csw:SummaryRecord>
            <dc:identifier>urn:uuid:88247b56-4cbc-4df9-9860-db3f8042e357</dc:identifier>
            <dc:title></dc:title>
            <dc:type>http://purl.org/dc/dcmitype/Dataset</dc:type>
            <dc:subject>Physiography-Landforms</dc:subject>
            <dct:abstract>Donec scelerisque pede ut nisl luctus accumsan. Quisque ultrices, lorem eget feugiat fringilla, lorem dui porttitor ante, cursus ultrices magna odio eu neque.</dct:abstract>
        </csw:SummaryRecord>
        <csw:SummaryRecord>
            <dc:identifier>urn:uuid:94bc9c83-97f6-4b40-9eb8-a8e8787a5c63</dc:identifier>
            <dc:title>Mauris sed neque</dc:title>
            <dc:type>http://purl.org/dc/dcmitype/Dataset</dc:type>
            <dc:subject>Vegetation-Cropland</dc:subject>
            <dct:abstract>Curabitur lacinia, ante non porta tempus, mi lorem feugiat odio, eget suscipit eros pede ac velit.</dct:abstract>
            <ows:BoundingBox crs="urn:x-ogc:def:crs:EPSG:6.11:4326" dimensions="2">
                <ows:LowerCorner>47.59 -4.1</ows:LowerCorner>
                <ows:UpperCorner>51.22 0.89</ows:UpperCorner>
            </ows:BoundingBox>
        </csw:SummaryRecord>
        <csw:SummaryRecord>
            <dc:identifier>urn:uuid:9a669547-b69b-469f-a11f-2d875366bbdc</dc:identifier>
            <dc:title>Ñunç elementum</dc:title>
            <dc:type>http://purl.org/dc/dcmitype/Dataset</dc:type>
            <dc:subject>Hydrography-Oceanographic</dc:subject>
            <ows:BoundingBox crs="urn:x-ogc:def:crs:EPSG:6.11:4326" dimensions="2">
                <ows:LowerCorner>44.79 -6.17</ows:LowerCorner>
                <ows:UpperCorner>51.13 -2.23</ows:UpperCorner>
            </ows:BoundingBox>
        </csw:SummaryRecord>
        <csw:SummaryRecord>
            <dc:identifier>urn:uuid:a06af396-3105-442d-8b40-22b57a90d2f2</dc:identifier>
            <dc:title>Lorem ipsum dolor sit amet</dc:title>
            <dc:type>http://purl.org/dc/dcmitype/Image</dc:type>
            <dc:format>image/jpeg</dc:format>
        </csw:SummaryRecord>
    </csw:SearchResults>
</csw:GetRecordsResponse>`;
        console.log({ parsed: xmlParser.parse(xml) });
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
        onSuccess: async ({ getMapLayers: { url, params, layers, token, layerLinkSchema, layerLinkTag } }) => {
            const mapLayers = await Promise.all(
                layers.map(async (layer) => {
                    const xml = await getMapLayer(url, params, layer.body, token);

                    return extractImageryUrl(xml, layer.name, layerLinkSchema, layerLinkTag); //layerLinkSchema=wmts_base layerLinkTag=mc:links name=othophoto-base
                }),
            );

            queryClient.setQueryData('getMapLayers', mapLayers); //for EveryLayer:url(wmts_base) name(name wmts_base) [{url:'',name:''}]
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
