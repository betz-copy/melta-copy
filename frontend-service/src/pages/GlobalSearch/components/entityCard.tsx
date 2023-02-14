import React from 'react';
import { Card, CardContent, CardHeader, Grid, IconButton } from '@mui/material';
import {
    AppRegistration as AppRegistrationIcon,
    ReadMore as ReadMoreIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { useQueryClient } from 'react-query';
import { NavLink } from 'react-router-dom';
import { CustomIcon } from '../../../common/CustomIcon';
import { IEntity } from '../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { EntityProperties } from '../../../common/EntityProperties';
import { EntityDisableCheckbox } from '../../Entity/components/EntityDisableCheckbox';
import { EntityDates } from '../../Entity/components/EntityDates';
import { BlueTitle } from '../../../common/BlueTitle';

const EntityCard: React.FC<{ entity: IEntity }> = ({ entity }) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const entityTemplate = entityTemplates.get(entity.templateId)!;

    const [hideFields, setHideFields] = React.useState(true);

    return (
        // todo: move card to common (used by "Entity Page" too)
        <Card variant="outlined" sx={{ overflowX: 'auto', width: '100%', borderRadius: '15px' }}>
            <CardHeader
                avatar={
                    entityTemplate.iconFileId ? (
                        <CustomIcon iconUrl={entityTemplate.iconFileId} height="40px" width="40px" />
                    ) : (
                        <AppRegistrationIcon sx={{ fontSize: '40px' }} />
                    )
                }
                action={
                    <Grid container>
                        {entityTemplate.properties.hide.length > 0 && (
                            <IconButton onClick={() => setHideFields((curr) => !curr)} size="large">
                                {hideFields ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                        )}
                        <NavLink to={`/entity/${entity.properties._id}`}>
                            <IconButton size="large">
                                <ReadMoreIcon
                                    style={{
                                        transform: 'scaleX(-1)',
                                    }}
                                />
                            </IconButton>
                        </NavLink>
                    </Grid>
                }
                title={<BlueTitle title={entityTemplate.displayName} component="h5" variant="h5" />}
                subheader={entityTemplate.category.displayName}
                // subheaderTypographyProps={{ variant: 'h6' }}
                sx={{ '& .MuiCardHeader-action': { marginRight: '0px' } }} // default is -8px
            />
            <CardContent>
                <EntityProperties entityTemplate={entityTemplate} properties={entity.properties} hideFields={hideFields} />
                <Grid container>
                    <EntityDisableCheckbox isEntityDisabled={entity.properties.disabled} />
                </Grid>
                <EntityDates createdAt={entity.properties.createdAt} updatedAt={entity.properties.updatedAt} />
            </CardContent>
        </Card>
    );
};

export default EntityCard;
