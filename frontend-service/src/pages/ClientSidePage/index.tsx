import { Box, CssBaseline } from '@mui/material';
import React, { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { AuthService } from '../../services/authService';
import { GetAllClientSideTemplatesType, getAllClientSideTemplates } from '../../services/clientSideService';
import { getById } from '../../services/workspacesService';
import { defaultMetadata, useWorkspaceStore } from '../../stores/workspace';
import '../../css/index.css';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { ICategoryMap } from '@packages/category';
import { IChildTemplateMap } from '@packages/child-template';
import { IEntityTemplateMap } from '@packages/entity-template';
import { IRelationshipTemplateMap } from '@packages/relationship-template';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import { LoadingAnimation } from '../../common/LoadingAnimation';
import { mapTemplates } from '../../utils/templates';
import ErrorPage from '../ErrorPage';
import ClientSidePageInner from './ClientSidePageInner';

const cacheRtl = createCache({
    key: 'muirtl',
    stylisPlugins: [prefixer, rtlPlugin],
});

const ClientSidePage: React.FC = () => {
    const user = AuthService.getUser();
    const setWorkspace = useWorkspaceStore((state) => state.setWorkspace);

    const queryClient = useQueryClient();

    useQuery('getClientSideCategories', () => undefined, { enabled: false });
    useQuery('getClientSideEntityTemplates', () => undefined, { enabled: false });
    useQuery('getClientSideChildTemplates', () => undefined, { enabled: false });
    useQuery('getClientSideRelationshipTemplates', () => undefined, { enabled: false });

    useQuery('getEntityTemplates', () => undefined, { enabled: false });
    useQuery('getRelationshipTemplates', () => undefined, { enabled: false });

    const {
        data: workspace,
        isLoading: isLoadingWorkspace,
        isError: isErrorWorkspace,
    } = useQuery({
        queryKey: ['workspace', user?.clientSideWorkspaceId],
        queryFn: () => getById(user?.clientSideWorkspaceId || ''),
    });

    const { isLoading: isLoadingAllClientSideTemplates, isError: isErrorAllClientSideTemplates } = useQuery<GetAllClientSideTemplatesType>(
        'getAllClientSideTemplates',
        () => getAllClientSideTemplates(workspace?.metadata?.clientSide!.usersInfoChildTemplateId || ''),
        {
            onError: (error) => {
                toast.error(i18next.t('failedToGetTemplates'));
                console.error('failed to get templates error:', error);
            },
            onSuccess: ({ categories, entityTemplates, relationshipTemplates, childTemplates }) => {
                queryClient.setQueryData<ICategoryMap>('getClientSideCategories', mapTemplates(categories));
                queryClient.setQueryData<IEntityTemplateMap>('getClientSideEntityTemplates', mapTemplates(entityTemplates));
                queryClient.setQueryData<IChildTemplateMap>('getClientSideChildTemplates', mapTemplates(childTemplates));
                queryClient.setQueryData<IRelationshipTemplateMap>('getClientSideRelationshipTemplates', mapTemplates(relationshipTemplates));

                queryClient.setQueryData<IEntityTemplateMap>('getEntityTemplates', mapTemplates(entityTemplates));
                queryClient.setQueryData<IRelationshipTemplateMap>('getRelationshipTemplates', mapTemplates(relationshipTemplates));
            },
            enabled: Boolean(workspace?._id),
        },
    );

    useEffect(() => {
        if (workspace) {
            setWorkspace({
                ...workspace,
                metadata: { ...defaultMetadata, ...workspace.metadata },
            });
        }
    }, [workspace, setWorkspace]);

    const isLoading = useMemo(() => isLoadingAllClientSideTemplates || isLoadingWorkspace, [isLoadingAllClientSideTemplates, isLoadingWorkspace]);
    const isError = useMemo(() => isErrorAllClientSideTemplates || isErrorWorkspace, [isErrorAllClientSideTemplates, isErrorWorkspace]);

    if (isLoading) return <LoadingAnimation isLoading={isLoading} />;

    if (isError) return <ErrorPage errorText={i18next.t('errorPage.noPermissionsToWorkspace')} />;

    return (
        <CacheProvider value={cacheRtl}>
            <CssBaseline />
            <Box display="flex">
                <ClientSidePageInner />
            </Box>
        </CacheProvider>
    );
};

export default ClientSidePage;
