import React, { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { AuthService } from '../../services/authService';
import { defaultMetadata, useWorkspaceStore } from '../../stores/workspace';
import { getAllSimbaTemplates, GetAllSimbaTemplatesType } from '../../services/simbaService';
import { getById } from '../../services/workspacesService';
import { Box, CssBaseline } from '@mui/material';
import '../../css/index.css';
import { prefixer } from 'stylis';
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { ICategoryMap } from '../../interfaces/categories';
import { IEntityTemplateMap } from '../../interfaces/entityTemplates';
import { IEntityChildTemplateMapPopulated } from '../../interfaces/entityChildTemplates';
import { mapTemplates } from '../../utils/templates';
import { IRelationshipTemplateMap } from '../../interfaces/relationshipTemplates';
import ErrorPage from '../ErrorPage';
import { LoadingAnimation } from '../../common/LoadingAnimation';
import SimbaClientPageInner from './SimbaClientPageInner';

const cacheRtl = createCache({
    key: 'muirtl',
    stylisPlugins: [prefixer, rtlPlugin],
});

const SimbaClientPage: React.FC = () => {
    const user = AuthService.getUser();
    const setWorkspace = useWorkspaceStore((state) => state.setWorkspace);

    const queryClient = useQueryClient();

    useQuery('getSimbaCategories', () => undefined, { enabled: false });
    useQuery('getSimbaEntityTemplates', () => undefined, { enabled: false });
    useQuery('getSimbaChildEntityTemplates', () => undefined, { enabled: false });
    useQuery('getSimbaRelationshipTemplates', () => undefined, { enabled: false });

    useQuery('getEntityTemplates', () => undefined, { enabled: false });
    useQuery('getRelationshipTemplates', () => undefined, { enabled: false });

    const {
        data: workspace,
        isLoading: isLoadingWorkspace,
        isError: isErrorWorkspace,
    } = useQuery({
        queryKey: ['workspace', user?.simbaWorkspaceId],
        queryFn: () => getById(user?.simbaWorkspaceId || ''),
    });

    const { isLoading: isLoadingAllSimbaTemplates, isError: isErrorAllSimbaTemplates } = useQuery<GetAllSimbaTemplatesType>(
        'getAllSimbaTemplates',
        () => getAllSimbaTemplates(workspace?.metadata?.simba!.usersInfoTemplateId || ''),
        {
            onError: (error) => {
                toast.error(i18next.t('failedToGetTemplates'));
                console.error('failed to get templates error:', error);
            },
            onSuccess: ({ categories, entityTemplates, relationshipTemplates, childTemplates }) => {
                queryClient.setQueryData<ICategoryMap>('getSimbaCategories', mapTemplates(categories));
                queryClient.setQueryData<IEntityTemplateMap>('getSimbaEntityTemplates', mapTemplates(entityTemplates));
                queryClient.setQueryData<IEntityChildTemplateMapPopulated>('getSimbaChildEntityTemplates', mapTemplates(childTemplates));
                queryClient.setQueryData<IRelationshipTemplateMap>('getSimbaRelationshipTemplates', mapTemplates(relationshipTemplates));

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

    const isLoading = useMemo(() => isLoadingAllSimbaTemplates || isLoadingWorkspace, [isLoadingAllSimbaTemplates, isLoadingWorkspace]);
    const isError = useMemo(() => isErrorAllSimbaTemplates || isErrorWorkspace, [isErrorAllSimbaTemplates, isErrorWorkspace]);

    if (isLoading) return <LoadingAnimation isLoading={isLoading} />;

    if (isError) return <ErrorPage errorText={i18next.t('errorPage.noPermissionsToWorkspace')} />;

    return (
        <CacheProvider value={cacheRtl}>
            <CssBaseline />
            <Box display="flex">
                <SimbaClientPageInner />
            </Box>
        </CacheProvider>
    );
};

export default SimbaClientPage;
