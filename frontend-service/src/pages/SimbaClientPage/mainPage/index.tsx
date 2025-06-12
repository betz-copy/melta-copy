import { Grid } from '@mui/material';
import UserInfoCard from './UserInfoCard';
import { Box } from '@mui/material';
import React, { useRef } from 'react';
import ContactInfoCard from './ContactInfoCard';
import UserEntityTables, { UserEntityTablesRef } from './UserEntityTables';
import { useSimbaUserStore } from '../../../stores/simbaUser';
import { useQueryClient } from 'react-query';
import { IEntityChildTemplateMapPopulated } from '../../../interfaces/entityChildTemplates';
import { useWorkspaceStore } from '../../../stores/workspace';

const SimbaMainPage: React.FC = () => {
    const simbaUserEntity = useSimbaUserStore((state) => state.simbaUserEntity);
    const queryClient = useQueryClient();
    const workspace = useWorkspaceStore((state) => state.workspace);
    const { numOfPropsToShow, usersInfoChildTemplateId } = workspace.metadata.simba;

    const childTemplates = queryClient.getQueryData<IEntityChildTemplateMapPopulated>('getSimbaChildEntityTemplates')!;
    const usersInfoChildTemplate = childTemplates.get(usersInfoChildTemplateId)!;

    const userEntityTablesRef = useRef<UserEntityTablesRef>(null);

    const firstXPropsKeys: string[] = [
        ...usersInfoChildTemplate.fatherTemplateId.propertiesPreview,
        ...usersInfoChildTemplate.fatherTemplateId.propertiesOrder
            .filter(
                (property) =>
                    !usersInfoChildTemplate.fatherTemplateId.propertiesPreview.includes(property) &&
                    usersInfoChildTemplate.fatherTemplateId.properties.properties[property].format !== 'fileId' &&
                    usersInfoChildTemplate.fatherTemplateId.properties.properties[property].items?.format !== 'fileId',
            )
            .slice(0, Math.max(numOfPropsToShow - usersInfoChildTemplate.fatherTemplateId.propertiesPreview.length, 0)),
    ];

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
                            currentUserFromSimba={simbaUserEntity}
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
                        currentUserFromSimba={simbaUserEntity}
                        usersInfoChildTemplate={usersInfoChildTemplate}
                        ref={userEntityTablesRef}
                    />
                </Grid>
            </Box>
        </>
    );
};

export default SimbaMainPage;
