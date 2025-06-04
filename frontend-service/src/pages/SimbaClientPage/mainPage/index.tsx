import { Grid } from '@mui/material';
import UserInfoCard from './UserInfoCard';
import { Box } from '@mui/material';
import React from 'react';
import ContactInfoCard from './ContactInfoCard';
import UserEntityTables from './UserEntityTables';
import { useSimbaUserStore } from '../../../stores/simbaUser';
import { useQuery, useQueryClient } from 'react-query';
import { IEntityChildTemplateMapPopulated } from '../../../interfaces/entityChildTemplates';
import { useWorkspaceStore } from '../../../stores/workspace';
import { countEntitiesOfTemplatesByUserEntityId } from '../../../services/simbaService';

const SimbaMainPage: React.FC = () => {
    const simbaUserEntity = useSimbaUserStore((state) => state.simbaUserEntity);
    const queryClient = useQueryClient();
    const workspace = useWorkspaceStore((state) => state.workspace);

    const childTemplates = queryClient.getQueryData<IEntityChildTemplateMapPopulated>('getSimbaChildEntityTemplates')!;
    const usersInfoChildTemplate = childTemplates.get(workspace.metadata.simba.usersInfoTemplateId)!;

    const { data: countEntitiesOfTemplatesByUser } = useQuery({
        queryKey: ['countEntitiesOfTemplatesByUser', usersInfoChildTemplate?.fatherTemplateId._id, simbaUserEntity.properties._id],
        queryFn: () =>
            countEntitiesOfTemplatesByUserEntityId(
                Array.from(childTemplates.values()).map((template) => template.fatherTemplateId._id),
                simbaUserEntity.properties._id!,
            ),
        enabled: !!simbaUserEntity,
    });

    console.log('countEntitiesOfTemplatesByUser:', countEntitiesOfTemplatesByUser);

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
                <Grid container p="20px" gap={1} alignItems="top" justifyContent="space-evenly">
                    <Grid item xs={8}>
                        <UserInfoCard currentUserFromSimba={simbaUserEntity} usersInfoChildTemplate={usersInfoChildTemplate} />
                    </Grid>
                    <Grid item xs={3}>
                        <ContactInfoCard />
                    </Grid>
                    <Grid container item xs={12} justifyContent="center"></Grid>
                </Grid>
                <Grid container item xs={12} justifyContent="center">
                    <UserEntityTables childTemplates={Array.from(childTemplates.values())} currentUserFromSimba={simbaUserEntity} />
                </Grid>
            </Box>
        </>
    );
};

export default SimbaMainPage;
