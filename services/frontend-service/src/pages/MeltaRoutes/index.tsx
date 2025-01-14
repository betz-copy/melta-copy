import { Box } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { IEntityTemplateMap, IRelationshipTemplateMap, ICategoryMap, IRuleMap, IProcessTemplateMap } from '@microservices/shared-interfaces';
import { LoadingAnimation } from '../../common/LoadingAnimation';
import { getAllTemplates, GetAllTemplatesType } from '../../services/templates/getAllTemplates';
import { getFile } from '../../services/workspacesService';
import { useUserStore } from '../../stores/user';
import { useWorkspaceStore } from '../../stores/workspace';
import { mapTemplates } from '../../utils/templates';
import ErrorPage from '../ErrorPage';
import { MeltaRoutesInner } from './routes';
import { handleWorkspace } from '../../utils/permissions';

interface IMeltaRoutesProps {
    path: string;
}

export const MeltaRoutes: React.FC<IMeltaRoutesProps> = ({ path }) => {
    const setWorkspace = useWorkspaceStore((state) => state.setWorkspace);
    const currentUser = useUserStore((state) => state.user);
    const setUser = useUserStore((state) => state.setUser);

    const queryClient = useQueryClient();

    // use queries enabled false, setting query data by hand "queryClient.setQueryData" (setting from getAllTemplates)
    useQuery('getCategories', () => undefined, { enabled: false });
    useQuery('getEntityTemplates', () => undefined, { enabled: false });
    useQuery('getRelationshipTemplates', () => undefined, { enabled: false });
    useQuery('getRules', () => undefined, { enabled: false });
    useQuery('getProcessTemplates', () => undefined, { enabled: false });

    const {
        data: workspace,
        isLoading: isLoadingWorkspace,
        isError: isErrorWorkspace,
    } = useQuery({
        queryKey: ['workspace', path],
        queryFn: () => getFile(path),
    });

    const { isLoading: isLoadingAllTemplates, isError: isErrorAllTemplates } = useQuery<GetAllTemplatesType>('getAllTemplates', getAllTemplates, {
        onError: (error) => {
            toast.error(i18next.t('failedToGetTemplates'));
            // eslint-disable-next-line no-console
            console.log('failed to get templates error:', error);
        },
        onSuccess: ({ categories, entityTemplates, relationshipTemplates, processTemplates, rules }) => {
            queryClient.setQueryData<ICategoryMap>('getCategories', mapTemplates(categories));
            queryClient.setQueryData<IEntityTemplateMap>('getEntityTemplates', mapTemplates(entityTemplates));
            queryClient.setQueryData<IRelationshipTemplateMap>('getRelationshipTemplates', mapTemplates(relationshipTemplates));
            queryClient.setQueryData<IProcessTemplateMap>('getProcessTemplates', mapTemplates(processTemplates));
            queryClient.setQueryData<IRuleMap>('getRules', mapTemplates(rules, 'name'));
        },
        enabled: Boolean(workspace?._id),
    });

    useEffect(() => handleWorkspace(workspace?.displayName ?? '', setWorkspace, workspace), [workspace, setWorkspace, currentUser, setUser]);

    const isLoading = useMemo(() => isLoadingAllTemplates || isLoadingWorkspace, [isLoadingAllTemplates, isLoadingWorkspace]);
    const isError = useMemo(() => isErrorAllTemplates || isErrorWorkspace, [isErrorAllTemplates, isErrorWorkspace]);

    if (isLoading) return <LoadingAnimation isLoading={isLoading} />;

    if (isError) return <ErrorPage errorText={i18next.t('errorPage.noPermissionsToWorkspace')} navigateToRoot />;

    return <Box display="flex">{currentUser.currentWorkspacePermissions && <MeltaRoutesInner />}</Box>;
};
