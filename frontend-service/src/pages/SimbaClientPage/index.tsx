import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { AuthService } from '../../services/authService';
import { defaultMetadata, useWorkspaceStore } from '../../stores/workspace';
import { getCurrentUserEntity, getEntityChildTemplateByIdRequest } from '../../services/simbaService';
import { getById } from '../../services/workspacesService';
import { searchEntitiesOfTemplateRequest } from '../../services/entitiesService';

const SimbaClientPage: React.FC = () => {
    const user = AuthService.getUser();
    const queryClient = useQueryClient();
    const setWorkspace = useWorkspaceStore((state) => state.setWorkspace);

    const {
        data: workspace,
        isLoading: isLoadingWorkspace,
        isError: isErrorWorkspace,
    } = useQuery({
        queryKey: ['workspace', user?.simbaWorkspaceId],
        queryFn: () => getById(user?.simbaWorkspaceId || ''),
    });

    // Always call hooks at the top level
    const usersInfoTemplateId = workspace?.metadata?.simba?.usersInfoTemplateId;
    const { data: usersInfoChildTemplate } = useQuery({
        queryKey: ['entityChildTemplate', usersInfoTemplateId],
        queryFn: () => getEntityChildTemplateByIdRequest(usersInfoTemplateId || ''),
        enabled: !!usersInfoTemplateId, // Only run if ID is available
    });

    const { data: currentUserFromSimba } = useQuery({
        queryKey: ['searchEntitiesOfTemplate', usersInfoChildTemplate?.fatherTemplateId._id, user?.kartoffelId],
        queryFn: () => getCurrentUserEntity(usersInfoChildTemplate?.fatherTemplateId._id || '', user?.kartoffelId!),
        enabled: !!usersInfoChildTemplate?.fatherTemplateId._id,
    });

    console.log(currentUserFromSimba);

    useEffect(() => {
        if (workspace) {
            setWorkspace({
                ...workspace,
                metadata: { ...defaultMetadata, ...workspace.metadata },
            });
        }
    }, [workspace, setWorkspace]);

    if (isLoadingWorkspace) {
        return <div>Loading...</div>;
    }

    if (isErrorWorkspace || !workspace) {
        return <div>Error</div>;
    }

    if (!usersInfoChildTemplate && usersInfoTemplateId) {
        return <div>No users info child template</div>;
    }

    // console.log(workspace.metadata?.simba?.usersInfoTemplateId);
    // console.log(usersInfoChildTemplate);
    // console.log(user);
    console.log(usersInfoChildTemplate);

    return <div>SimbaClientPage</div>;
};

export default SimbaClientPage;
