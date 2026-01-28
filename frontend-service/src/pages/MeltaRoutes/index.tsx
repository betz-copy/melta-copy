import { Box } from '@mui/material';
import i18next from 'i18next';
import _ from 'lodash';
import React, { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { LoadingAnimation } from '../../common/LoadingAnimation';
import { IMongoCategoryOrderConfig } from '../../interfaces/config';
import {
    ICategoryMap,
    IChildTemplateMap,
    IEntityTemplateMap,
    IPrintingTemplateMap,
    IProcessTemplateMap,
    IRelationshipTemplateMap,
    IRuleMap,
} from '../../interfaces/template';
import { GetAllTemplatesType, getAllTemplates } from '../../services/templates/getAllTemplates';
import { getUnits } from '../../services/userService';
import { getFile } from '../../services/workspacesService';
import { useUnitStore } from '../../stores/unit';
import { useUserStore } from '../../stores/user';
import { defaultMetadata, useWorkspaceStore } from '../../stores/workspace';
import { handleWorkspace } from '../../utils/permissions';
import { mapCategories, mapTemplates } from '../../utils/templates';
import ErrorPage from '../ErrorPage';
import { MeltaRoutesInner } from './routes';

interface IMeltaRoutesProps {
    path: string;
}

export const MeltaRoutes: React.FC<IMeltaRoutesProps> = ({ path }) => {
    const setWorkspace = useWorkspaceStore((state) => state.setWorkspace);
    const currentUser = useUserStore((state) => state.user);
    const setUser = useUserStore((state) => state.setUser);
    const setEnabledUnits = useUnitStore((state) => state.setEnabledUnits);

    const queryClient = useQueryClient();

    // use queries enabled false, setting query data by hand "queryClient.setQueryData" (setting from getAllTemplates)
    useQuery('getCategories', () => undefined, { enabled: false });
    useQuery('getCategoryOrder', () => undefined, { enabled: false });
    useQuery('getEntityTemplates', () => undefined, { enabled: false });
    useQuery('getChildTemplates', () => undefined, { enabled: false });
    useQuery('getRelationshipTemplates', () => undefined, { enabled: false });
    useQuery('getRules', () => undefined, { enabled: false });
    useQuery('getProcessTemplates', () => undefined, { enabled: false });
    useQuery('getPrintingTemplates', () => undefined, { enabled: false });

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
            console.error('failed to get templates error:', error);
        },
        onSuccess: ({
            categories,
            categoryOrder,
            entityTemplates,
            relationshipTemplates,
            processTemplates,
            rules,
            childTemplates,
            printingTemplates,
        }) => {
            queryClient.setQueryData<ICategoryMap>('getCategories', mapCategories(categories, categoryOrder ? categoryOrder.order : []));
            queryClient.setQueryData<IMongoCategoryOrderConfig>('getCategoryOrder', categoryOrder);
            queryClient.setQueryData<IEntityTemplateMap>('getEntityTemplates', mapTemplates(entityTemplates));
            queryClient.setQueryData<IChildTemplateMap>('getChildTemplates', mapTemplates(childTemplates, 'name'));
            queryClient.setQueryData<IRelationshipTemplateMap>('getRelationshipTemplates', mapTemplates(relationshipTemplates));
            queryClient.setQueryData<IProcessTemplateMap>('getProcessTemplates', mapTemplates(processTemplates));
            queryClient.setQueryData<IRuleMap>('getRules', mapTemplates(rules, 'name'));
            queryClient.setQueryData<IPrintingTemplateMap>('getPrintingTemplates', mapTemplates(printingTemplates, 'name'));
        },
        enabled: Boolean(workspace?._id),
    });

    // TODO move to all?
    const { data: units = [] } = useQuery({
        queryKey: 'getUnits',
        queryFn: () => getUnits({ workspaceIds: [workspace!._id] }),
        enabled: Boolean(workspace?._id),
    });

    useEffect(() => {
        if (!units || !workspace) return;

        setEnabledUnits(units);

        if (!_.isEqual(currentUser.usersUnitsWithInheritance, currentUser.units?.[workspace._id]))
            setUser({ ...currentUser, usersUnitsWithInheritance: currentUser.units?.[workspace._id] ?? [] });
    }, [units, setEnabledUnits, workspace, currentUser, setUser]);

    useEffect(() => {
        if (workspace) {
            handleWorkspace(workspace.displayName || '', setWorkspace, {
                ...workspace,
                metadata: { ...defaultMetadata, ...workspace.metadata },
            });
        }
    }, [workspace, setWorkspace]);

    const isLoading = useMemo(() => isLoadingAllTemplates || isLoadingWorkspace, [isLoadingAllTemplates, isLoadingWorkspace]);
    const isError = useMemo(() => isErrorAllTemplates || isErrorWorkspace, [isErrorAllTemplates, isErrorWorkspace]);

    if (isLoading) return <LoadingAnimation isLoading={isLoading} />;

    if (isError) return <ErrorPage errorText={i18next.t('errorPage.noPermissionsToWorkspace')} navigateToRoot />;

    return <Box display="flex">{currentUser.currentWorkspacePermissions && <MeltaRoutesInner />}</Box>;
};
