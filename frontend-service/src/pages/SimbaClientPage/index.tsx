import React, { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { AuthService } from '../../services/authService';
import { defaultMetadata, useWorkspaceStore } from '../../stores/workspace';
import {
    // countEntitiesOfTemplatesByUserEntityId,
    // getAllRelationshipsTemplatesByUserTemplateId,
    getAllSimbaTemplates,
    GetAllSimbaTemplatesType,
    // getAllTemplates,
    // getCurrentUserEntity,
    // getEntityChildTemplateByIdRequest,
} from '../../services/simbaService';
import { getById } from '../../services/workspacesService';
import { Box, CssBaseline } from '@mui/material';
// import { MainBox } from '../../Main.styled';
import '../../css/index.css';

// import { ContactInfoCard } from './ContactInfoCard';
import { prefixer } from 'stylis';
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
// import { Topbar } from './Topbar';
// import { IKartoffelUser } from '../../interfaces/users';
// import UserInfoCard from './UserInfoCard';
// import UserEntityTables from './UserEntityTables';
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

    // const usersInfoTemplateId = workspace?.metadata?.simba?.usersInfoTemplateId;
    // const { data: usersInfoChildTemplate } = useQuery({
    //     queryKey: ['entityChildTemplate', usersInfoTemplateId],
    //     queryFn: () => getEntityChildTemplateByIdRequest(usersInfoTemplateId || ''),
    // });

    // const { data: currentUserFromSimba } = useQuery({
    //     queryKey: ['searchEntitiesOfTemplate', usersInfoChildTemplate?.fatherTemplateId._id, user?.kartoffelId],
    //     queryFn: () => getCurrentUserEntity(usersInfoChildTemplate?.fatherTemplateId._id || '', user?.kartoffelId!),
    // });

    // console.log(currentUserFromSimba);

    // const { data: allChildTemplates } = useQuery({
    //     queryKey: ['allTemplates', currentUserFromSimba?.properties.full_name._id],
    //     queryFn: () => getAllTemplates(),
    //     enabled: !!usersInfoChildTemplate,
    // });

    // console.log(allChildTemplates);

    // const { data: allRelationshipsTemplates } = useQuery({
    //     queryKey: ['allRelationshipsTemplates', usersInfoChildTemplate?.fatherTemplateId._id],
    //     queryFn: () => getAllRelationshipsTemplatesByUserTemplateId(usersInfoChildTemplate?.fatherTemplateId._id || ''),
    //     enabled: !!usersInfoChildTemplate,
    // });

    // console.log('allRelationshipsTemplates: ', allRelationshipsTemplates);

    // const allRelatedChildTemplates = allChildTemplates?.filter(
    //     (childTemplate) =>
    //         allRelationshipsTemplates?.some(
    //             (relationshipTemplate) =>
    //                 relationshipTemplate.destinationEntityId === childTemplate.fatherTemplateId._id ||
    //                 relationshipTemplate.sourceEntityId === childTemplate.fatherTemplateId._id,
    //         ) && childTemplate.fatherTemplateId._id !== usersInfoChildTemplate?.fatherTemplateId._id,
    // );

    // console.log('allRelatedChildTemplates: ', allRelatedChildTemplates);

    // const { data: countEntitiesOfTemplatesByUser } = useQuery({
    //     queryKey: ['countEntitiesOfTemplatesByUser', usersInfoChildTemplate?.fatherTemplateId._id, user?.kartoffelId],
    //     queryFn: () =>
    //         countEntitiesOfTemplatesByUserEntityId(
    //             allRelatedChildTemplates?.map((template) => template.fatherTemplateId._id) || [],
    //             user?.kartoffelId!,
    //         ),
    //     enabled: !!currentUserFromSimba,
    // });

    // console.log('countEntitiesOfTemplatesByUser: ', countEntitiesOfTemplatesByUser);

    // if (isLoadingWorkspace) {
    //     return <div>Loading...</div>;
    // }
    // if (isErrorWorkspace) {
    //     return <div>Error</div>;
    // }
    // if (!usersInfoChildTemplate || !currentUserFromSimba) {
    //     return <div>No users info child template</div>;
    // }

    // const currentUser: IKartoffelUser = JSON.parse(currentUserFromSimba.properties.full_name);

    // return (
    //     <CacheProvider value={cacheRtl}>
    //         <CssBaseline />
    //         <>
    //             <MainBox
    //                 ref={(ref: HTMLElement | null) => {
    //                     pageScrollTargetRef.current = ref;
    //                 }}
    //                 style={{
    //                     overflowY: 'hidden',
    //                     overflowX: 'hidden',
    //                     position: 'relative',
    //                     zIndex: 1,
    //                 }}
    //             >
    //                 <Box
    //                     component="img"
    //                     src="/images/simba-background.png"
    //                     sx={{
    //                         width: '45%',
    //                         opacity: 0.3,
    //                         position: 'absolute',
    //                         top: '55%',
    //                         left: '50%',
    //                         transform: 'translate(-50%, -50%)',
    //                         pointerEvents: 'none',
    //                         zIndex: -1,
    //                     }}
    //                 />
    //                 <Box>
    //                     <Suspense fallback={<div />}>
    //                         <Topbar currentUser={currentUser} />
    //                         <Box
    //                             sx={{
    //                                 width: '100%',
    //                                 height: '100%',
    //                                 paddingRight: '30px',
    //                                 paddingLeft: '30px',
    //                             }}
    //                         >
    //                             <Grid container p="20px" gap={1} alignItems="top" justifyContent="space-evenly">
    //                                 <Grid item xs={8}>
    //                                     <UserInfoCard currentUserFromSimba={currentUserFromSimba} usersInfoChildTemplate={usersInfoChildTemplate} />
    //                                 </Grid>
    //                                 <Grid item xs={3}>
    //                                     <ContactInfoCard />
    //                                 </Grid>
    //                                 <Grid container item xs={12} justifyContent="center"></Grid>
    //                             </Grid>
    //                             <Grid container item xs={12} justifyContent="center">
    //                                 <UserEntityTables childTemplates={allChildTemplates || []} currentUserFromSimba={currentUserFromSimba} />
    //                             </Grid>
    //                         </Box>
    //                     </Suspense>
    //                 </Box>
    //             </MainBox>
    //         </>
    //     </CacheProvider>
    // );
};

export default SimbaClientPage;
