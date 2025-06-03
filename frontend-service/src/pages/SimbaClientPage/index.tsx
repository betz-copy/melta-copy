import React, { Suspense, useEffect, useRef } from 'react';
import { useQuery } from 'react-query';
import { AuthService } from '../../services/authService';
import { defaultMetadata, useWorkspaceStore } from '../../stores/workspace';
import { getCurrentUserEntity, getEntityChildTemplateByIdRequest } from '../../services/simbaService';
import { getById } from '../../services/workspacesService';
import { Box, CssBaseline, Grid } from '@mui/material';
import { MainBox } from '../../Main.styled';
import '../../css/index.css';

import { ContactInfoCard } from './ContactInfoCard';
import { prefixer } from 'stylis';
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import { Topbar } from './Topbar';
import { IKartoffelUser } from '../../interfaces/users';
import UserInfoCard from './UserInfoCard';
import TemplateTablesView from '../../common/EntitiesPage/TemplateTablesView';

const cacheRtl = createCache({
    key: 'muirtl',
    stylisPlugins: [prefixer, rtlPlugin],
});

const SimbaClientPage: React.FC = () => {
    const user = AuthService.getUser();
    const setWorkspace = useWorkspaceStore((state) => state.setWorkspace);
    const pageScrollTargetRef = useRef<HTMLElement | null>(null);

    const {
        data: fetchedWorkspace,
        isLoading: isLoadingWorkspace,
        isError: isErrorWorkspace,
    } = useQuery({
        queryKey: ['workspace', user?.simbaWorkspaceId],
        queryFn: () => getById(user?.simbaWorkspaceId || ''),
    });

    const usersInfoTemplateId = fetchedWorkspace?.metadata?.simba?.usersInfoTemplateId;
    const { data: usersInfoChildTemplate } = useQuery({
        queryKey: ['entityChildTemplate', usersInfoTemplateId],
        queryFn: () => getEntityChildTemplateByIdRequest(usersInfoTemplateId || ''),
    });

    const { data: currentUserFromSimba } = useQuery({
        queryKey: ['searchEntitiesOfTemplate', usersInfoChildTemplate?.fatherTemplateId._id, user?.kartoffelId],
        queryFn: () => getCurrentUserEntity(usersInfoChildTemplate?.fatherTemplateId._id || '', user?.kartoffelId!),
    });

    console.log(currentUserFromSimba);

    useEffect(() => {
        if (fetchedWorkspace) {
            setWorkspace({
                ...fetchedWorkspace,
                metadata: { ...defaultMetadata, ...fetchedWorkspace.metadata },
            });
        }
    }, [fetchedWorkspace, setWorkspace]);

    if (isLoadingWorkspace) {
        return <div>Loading...</div>;
    }
    if (isErrorWorkspace) {
        return <div>Error</div>;
    }
    if (!usersInfoChildTemplate || !currentUserFromSimba) {
        return <div>No users info child template</div>;
    }

    const currentUser: IKartoffelUser = JSON.parse(currentUserFromSimba.properties.full_name);

    return (
        <CacheProvider value={cacheRtl}>
            <CssBaseline />
            <>
                <MainBox
                    ref={(ref: HTMLElement | null) => {
                        pageScrollTargetRef.current = ref;
                    }}
                    style={{
                        overflowY: 'hidden',
                        overflowX: 'hidden',
                        position: 'relative',
                        zIndex: 1,
                    }}
                >
                    <Box
                        component="img"
                        src="/images/simba-background.png"
                        sx={{
                            width: '45%',
                            opacity: 0.3,
                            position: 'absolute',
                            top: '55%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            pointerEvents: 'none',
                            zIndex: -1,
                        }}
                    />
                    <Box>
                        <Suspense fallback={<div />}>
                            <Topbar currentUser={currentUser} />
                            <Box
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    paddingRight: '30px',
                                    paddingLeft: '30px',
                                }}
                            >
                                <Grid container p="20px" gap={1} alignItems="top" justifyContent="space-evenly">
                                    <Grid item xs={8}>
                                        <UserInfoCard currentUserFromSimba={currentUserFromSimba} usersInfoChildTemplate={usersInfoChildTemplate} />
                                    </Grid>
                                    <Grid item xs={3}>
                                        <ContactInfoCard />
                                    </Grid>
                                    <Grid container item xs={12} justifyContent="center"></Grid>
                                </Grid>
                                <Grid container item xs={12} justifyContent="center">
                                    <TemplateTablesView
                                        templates={[]}
                                        searchInput={''}
                                        pageType={'simba'}
                                        semanticSearch={false}
                                        setUpdatedEntities={() => {}}
                                    />
                                </Grid>
                            </Box>
                        </Suspense>
                    </Box>
                </MainBox>
            </>
        </CacheProvider>
    );
};

export default SimbaClientPage;
