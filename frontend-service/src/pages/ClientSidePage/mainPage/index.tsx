import { Box, Grid } from '@mui/material';
import React, { useRef } from 'react';
import { useQueryClient } from 'react-query';
import { IChildTemplateMap } from '../../../interfaces/template';
import { useClientSideUserStore } from '../../../stores/clientSideUser';
import { useWorkspaceStore } from '../../../stores/workspace';
import { getFirstXPropsKeys } from '../../../utils/templates';
import ContactInfoCard from './ContactInfoCard';
import UserEntityTables, { UserEntityTablesRef } from './UserEntityTables';
import UserInfoCard from './UserInfoCard';

const ClientSideMainPage: React.FC = () => {
    const clientSideUserEntity = useClientSideUserStore((state) => state.clientSideUserEntity);
    const queryClient = useQueryClient();
    const workspace = useWorkspaceStore((state) => state.workspace);
    const { numOfPropsToShow, usersInfoChildTemplateId } = workspace.metadata.clientSide;

    const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getClientSideChildTemplates')!;
    const usersInfoChildTemplate = childTemplates.get(usersInfoChildTemplateId)!;

    const userEntityTablesRef = useRef<UserEntityTablesRef>(null);

    const firstXPropsKeys: string[] = getFirstXPropsKeys(numOfPropsToShow, usersInfoChildTemplate.parentTemplate);

    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                paddingRight: '30px',
                paddingLeft: '30px',
            }}
        >
            <Grid container paddingY="20px" alignItems="top" justifyContent="space-between" width="100%">
                <Grid width="70%">
                    <UserInfoCard
                        currentUserFromClientSide={clientSideUserEntity}
                        usersInfoChildTemplate={usersInfoChildTemplate}
                        overridePropertiesToShow={firstXPropsKeys}
                    />
                </Grid>
                <Grid width="28%">
                    <ContactInfoCard />
                </Grid>
                <Grid container size={{ xs: 12 }} justifyContent="center"></Grid>
            </Grid>
            <Grid container size={{ xs: 12 }} justifyContent="center">
                <UserEntityTables
                    childTemplates={Array.from(childTemplates.values())}
                    currentUserFromClientSide={clientSideUserEntity}
                    usersInfoChildTemplate={usersInfoChildTemplate}
                    ref={userEntityTablesRef}
                />
            </Grid>
        </Box>
    );
};

export default ClientSideMainPage;
