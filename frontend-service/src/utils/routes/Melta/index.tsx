import { Box } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { updateAxiosWorkspaceHeader } from '../../../axios';
import { LoadingAnimation } from '../../../common/LoadingAnimation';
import { ICategoryMap } from '../../../interfaces/categories';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { IProcessTemplateMap } from '../../../interfaces/processes/processTemplate';
import { IRelationshipTemplateMap } from '../../../interfaces/relationshipTemplates';
import { IRuleMap } from '../../../interfaces/rules';
import ErrorPage from '../../../pages/ErrorPage';
import { getAllTemplates, GetAllTemplatesType } from '../../../services/templates/getAllTemplates';
import { getFile } from '../../../services/workspacesService';
import { useUserStore } from '../../../stores/user';
import { useWorkspaceStore } from '../../../stores/workspace';
import { mapTemplates } from '../../templates';
import { MeltaRoutesInner } from './routes';

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

    console.log({ workspace });

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

    useEffect(() => {
        if (!workspace) return;

        setWorkspace(workspace);

        if (currentUser.currentWorkspacePermissions !== currentUser.permissions[workspace._id])
            setUser({ ...currentUser, currentWorkspacePermissions: currentUser.permissions[workspace._id] });

        updateAxiosWorkspaceHeader(workspace._id);
    }, [workspace, setWorkspace, currentUser, setUser]);

    const isLoading = useMemo(() => isLoadingAllTemplates || isLoadingWorkspace, [isLoadingAllTemplates, isLoadingWorkspace]);
    const isError = useMemo(() => isErrorAllTemplates || isErrorWorkspace, [isErrorAllTemplates, isErrorWorkspace]);

    if (isLoading) return <LoadingAnimation isLoading={isLoadingWorkspace} />;

    if (isError) return <ErrorPage errorText={i18next.t('errorPage.systemUnavailable')} />;

    return (
        <Box display="flex">
            <MeltaRoutesInner />
        </Box>
    );
};
