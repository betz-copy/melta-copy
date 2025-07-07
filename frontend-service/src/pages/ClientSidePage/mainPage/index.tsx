import { Grid } from '@mui/material';
import UserInfoCard from './UserInfoCard';
import { Box } from '@mui/material';
import React, { useRef } from 'react';
import ContactInfoCard from './ContactInfoCard';
import UserEntityTables, { UserEntityTablesRef } from './UserEntityTables';
import { useClientSideUserStore } from '../../../stores/clientSideUser';
import { useQueryClient } from 'react-query';
import { IEntityChildTemplateMapPopulated } from '../../../interfaces/entityChildTemplates';
import { useWorkspaceStore } from '../../../stores/workspace';
import { getFirstXPropsKeys } from '../../../utils/templates';

const ClientSideMainPage: React.FC = () => {
    const clientSideUserEntity = useClientSideUserStore((state) => state.clientSideUserEntity);
    const queryClient = useQueryClient();
    const workspace = useWorkspaceStore((state) => state.workspace);
    const { numOfPropsToShow, usersInfoChildTemplateId } = workspace.metadata.clientSide;

    const childTemplates = queryClient.getQueryData<IEntityChildTemplateMapPopulated>('getClientSideChildEntityTemplates')!;
    const usersInfoChildTemplate = childTemplates.get(usersInfoChildTemplateId)!;

    const userEntityTablesRef = useRef<UserEntityTablesRef>(null);

    const firstXPropsKeys: string[] = getFirstXPropsKeys(numOfPropsToShow, usersInfoChildTemplate.fatherTemplateId);

    return (
        <>
            <Box
                sx={{
                    width: '100%',
                    height: '100%',
                    paddingRight: '30px',
                    paddingLeft: '30px',
                }}
            >
                <Grid container paddingY="20px" alignItems="top" justifyContent="space-between" width="100%">
                    <Grid item width="70%">
                        <UserInfoCard
                            currentUserFromClientSide={clientSideUserEntity}
                            usersInfoChildTemplate={usersInfoChildTemplate}
                            overridePropertiesToShow={firstXPropsKeys}
                        />
                    </Grid>
                    <Grid item width="28%">
                        <ContactInfoCard />
                    </Grid>
                    <Grid container item xs={12} justifyContent="center"></Grid>
                </Grid>
                <Grid container item xs={12} justifyContent="center">
                    <UserEntityTables
                        childTemplates={Array.from(childTemplates.values())}
                        currentUserFromClientSide={clientSideUserEntity}
                        usersInfoChildTemplate={usersInfoChildTemplate}
                        ref={userEntityTablesRef}
                    />
                </Grid>
            </Box>
        </>
    );
};

export default ClientSideMainPage;
