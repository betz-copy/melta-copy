import React, { Suspense, useEffect, useRef } from 'react';
import { useQuery } from 'react-query';
import { AuthService } from '../../services/authService';
import { defaultMetadata, useWorkspaceStore } from '../../stores/workspace';
import { getCurrentUserEntity, getEntityChildTemplateByIdRequest } from '../../services/simbaService';
import { getById } from '../../services/workspacesService';
import { Box, Card, CardContent, CssBaseline, Grid, useTheme } from '@mui/material';
import { EntityProperties } from '../../common/EntityProperties';
import { MainBox } from '../../Main.styled';
import { useDarkModeStore } from '../../stores/darkMode';
import { EntityTemplateColor } from '../../common/EntityTemplateColor';
import { CustomIcon } from '../../common/CustomIcon';
import { BlueTitle } from '../../common/BlueTitle';
import { getEntityTemplateColor } from '../../utils/colors';
import { AppRegistration as DefaultEntityTemplateIcon } from '@mui/icons-material';
import '../../css/index.css';

import { EntityDates } from '../Entity/components/EntityDates';
import { ContactInfoCard } from './contactInfoCard';
import { prefixer } from 'stylis';
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import { Topbar } from './topbar';
import { IKartoffelUser } from '../../interfaces/users';

const cacheRtl = createCache({
    key: 'muirtl',
    stylisPlugins: [prefixer, rtlPlugin],
});

const SimbaClientPage: React.FC = () => {
    const user = AuthService.getUser();
    const setWorkspace = useWorkspaceStore((state) => state.setWorkspace);
    const workspace = useWorkspaceStore((state) => state.workspace);
    const pageScrollTargetRef = useRef<HTMLElement | null>(null);
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const theme = useTheme();

    const {
        data: fetchedWorkspace,
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
    if (isErrorWorkspace || !workspace) {
        return <div>Error</div>;
    }
    if (!usersInfoChildTemplate || !currentUserFromSimba) {
        return <div>No users info child template</div>;
    }

    const currentUser: IKartoffelUser = JSON.parse(currentUserFromSimba.properties.full_name);

    const entityTemplateColor = getEntityTemplateColor(usersInfoChildTemplate.fatherTemplateId);
    const { height, width } = workspace!.metadata!.iconSize!;

    return (
        <CacheProvider value={cacheRtl}>
            <CssBaseline />
            <>
                <MainBox
                    id="simba-box"
                    ref={(ref: HTMLElement | null) => {
                        pageScrollTargetRef.current = ref;
                    }}
                    style={{ overflowY: 'hidden', overflowX: 'hidden' }}
                >
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
                                        <Grid container justifyContent="space-between" width="fit-content" minWidth="fit-content">
                                            <Grid item container xs={5} alignItems="center" minWidth="fit-content" gap="10px">
                                                <Grid item minWidth="fit-content">
                                                    <EntityTemplateColor entityTemplateColor={entityTemplateColor} />
                                                </Grid>
                                                <Grid
                                                    item
                                                    minWidth="fit-content"
                                                    sx={{ display: 'flex', justifyContent: 'center', alignContent: 'center' }}
                                                >
                                                    {usersInfoChildTemplate.fatherTemplateId.iconFileId ? (
                                                        <CustomIcon
                                                            iconUrl={usersInfoChildTemplate.fatherTemplateId.iconFileId}
                                                            height={height}
                                                            width={width}
                                                            color={theme.palette.primary.main}
                                                        />
                                                    ) : (
                                                        <DefaultEntityTemplateIcon
                                                            sx={{
                                                                color: theme.palette.primary.main,
                                                                height,
                                                                width,
                                                            }}
                                                        />
                                                    )}
                                                </Grid>
                                                <Grid item minWidth="fit-content" style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                                    <BlueTitle
                                                        style={{
                                                            minWidth: 'fit-content',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            fontWeight: '500',
                                                            fontSize: workspace.metadata.mainFontSizes.entityTemplateTitleFontSize,
                                                        }}
                                                        title={usersInfoChildTemplate.fatherTemplateId.displayName}
                                                        component="h5"
                                                        variant="h5"
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                        <Card
                                            style={{
                                                background: darkMode ? '#171717' : 'white',
                                                borderRadius: '10px',
                                                boxShadow: '-2px 2px 6px 0px #1e27754d',
                                            }}
                                            sx={{ mt: 1 }}
                                        >
                                            <CardContent sx={{ '&:last-child': { padding: 0, mt: 1 } }}>
                                                <Grid item container flexDirection="column" flexWrap="nowrap" padding="20px">
                                                    <Grid item height="40%">
                                                        <EntityProperties
                                                            entityTemplate={usersInfoChildTemplate!.fatherTemplateId}
                                                            properties={currentUserFromSimba.properties}
                                                            style={{
                                                                flexDirection: 'row',
                                                                flexWrap: 'wrap',
                                                                rowGap: '20px',
                                                                columnGap: '20px',
                                                                alignItems: 'center',
                                                                width: '100%',
                                                                maxHeight: '200px',
                                                            }}
                                                            innerStyle={{ width: '32%', maxHeight: '50px' }}
                                                            textWrap
                                                            mode="normal"
                                                        />
                                                    </Grid>
                                                    <Grid container item justifyContent="space-between">
                                                        <EntityDates
                                                            createdAt={currentUserFromSimba.properties.createdAt}
                                                            updatedAt={currentUserFromSimba.properties.updatedAt}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={3}>
                                        <ContactInfoCard />
                                    </Grid>
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
