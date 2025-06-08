import React from 'react';
import { CardContent, useTheme, Grid, Card } from '@mui/material';
import { EntityTemplateColor } from '../../../common/EntityTemplateColor';
import { BlueTitle } from '../../../common/BlueTitle';
import { CustomIcon } from '../../../common/CustomIcon';
import { useWorkspaceStore } from '../../../stores/workspace';
import { useDarkModeStore } from '../../../stores/darkMode';
import { getEntityTemplateColor } from '../../../utils/colors';
import { IMongoChildEntityTemplatePopulated } from '../../../interfaces/entityChildTemplates';
import { AppRegistration as DefaultEntityTemplateIcon } from '@mui/icons-material';
import { EntityProperties } from '../../../common/EntityProperties';
import { EntityDates } from '../../Entity/components/EntityDates';
import { IEntity } from '../../../interfaces/entities';

interface IUserInfoCardProps {
    currentUserFromSimba: IEntity;
    usersInfoChildTemplate: IMongoChildEntityTemplatePopulated;
}

const UserInfoCard: React.FC<IUserInfoCardProps> = ({ currentUserFromSimba, usersInfoChildTemplate }) => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const theme = useTheme();

    const entityTemplateColor = getEntityTemplateColor(usersInfoChildTemplate.fatherTemplateId);
    const { height, width } = workspace!.metadata!.iconSize!;

    const first9PropsKeys: string[] = [
        ...usersInfoChildTemplate.fatherTemplateId.propertiesPreview,
        ...usersInfoChildTemplate.fatherTemplateId.propertiesOrder
            .filter(
                (property) =>
                    !usersInfoChildTemplate.fatherTemplateId.propertiesPreview.includes(property) &&
                    usersInfoChildTemplate.fatherTemplateId.properties.properties[property].format !== 'fileId' &&
                    usersInfoChildTemplate.fatherTemplateId.properties.properties[property].items?.format !== 'fileId',
            )
            .slice(0, Math.max(9 - usersInfoChildTemplate.fatherTemplateId.propertiesPreview.length, 0)),
    ];

    return (
        <>
            <Grid container justifyContent="space-between" width="fit-content" minWidth="fit-content">
                <Grid item container xs={5} alignItems="center" minWidth="fit-content" gap="10px">
                    <Grid item minWidth="fit-content">
                        <EntityTemplateColor entityTemplateColor={entityTemplateColor} />
                    </Grid>
                    <Grid item minWidth="fit-content" sx={{ display: 'flex', justifyContent: 'center', alignContent: 'center' }}>
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
                                overridePropertiesToShow={first9PropsKeys}
                                style={{
                                    flexDirection: 'row',
                                    flexWrap: 'wrap',
                                    columnGap: '20px',
                                    alignItems: 'center',
                                    width: '100%',
                                }}
                                innerStyle={{ width: '32%', maxHeight: '50px' }}
                                textWrap
                                mode="normal"
                            />
                        </Grid>
                        <Grid container item justifyContent="space-between" paddingTop="25px">
                            <EntityDates
                                createdAt={currentUserFromSimba.properties.createdAt}
                                updatedAt={currentUserFromSimba.properties.updatedAt}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </>
    );
};

export default UserInfoCard;
