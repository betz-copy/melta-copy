import { AppRegistration as DefaultEntityTemplateIcon } from '@mui/icons-material';
import { Card, CardContent, Grid, useTheme } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { Link } from 'wouter';
import { CustomIcon } from '../../../common/CustomIcon';
import { EntityProperties } from '../../../common/EntityProperties';
import { EntityTemplateColor } from '../../../common/EntityTemplateColor';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import BlueTitle from '../../../common/MeltaDesigns/BlueTitle';
import { IMongoChildTemplatePopulated } from '../../../interfaces/childTemplates';
import { IEntity } from '../../../interfaces/entities';
import { useDarkModeStore } from '../../../stores/darkMode';
import { useWorkspaceStore } from '../../../stores/workspace';
import { getEntityTemplateColor } from '../../../utils/colors';
import { EntityDates } from '../../Entity/components/EntityDates';

interface IUserInfoCardProps {
    currentUserFromClientSide: IEntity;
    usersInfoChildTemplate: IMongoChildTemplatePopulated;
    overridePropertiesToShow?: string[];
    displayTilte?: boolean;
}

const UserInfoCard: React.FC<IUserInfoCardProps> = ({
    currentUserFromClientSide,
    usersInfoChildTemplate,
    overridePropertiesToShow,
    displayTilte = true,
}) => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const theme = useTheme();

    const usersInfoTemplate = usersInfoChildTemplate.parentTemplate;
    const entityTemplateColor = getEntityTemplateColor(usersInfoTemplate);
    const { height, width } = workspace!.metadata!.iconSize!;

    return (
        <>
            {displayTilte && (
                <Grid container justifyContent="space-between" width="100%">
                    <Grid item container justifyContent="space-between" width="100%">
                        <Grid item container xs={5} alignItems="center" minWidth="fit-content" gap="10px">
                            <Grid item minWidth="fit-content">
                                <EntityTemplateColor entityTemplateColor={entityTemplateColor} />
                            </Grid>
                            <Grid item minWidth="fit-content" sx={{ display: 'flex', justifyContent: 'center', alignContent: 'center' }}>
                                {usersInfoTemplate.iconFileId ? (
                                    <CustomIcon
                                        iconUrl={usersInfoTemplate.iconFileId}
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
                                    title={usersInfoTemplate.displayName}
                                    component="h5"
                                    variant="h5"
                                />
                            </Grid>
                        </Grid>
                        <Grid item>
                            <Grid item>
                                <Link href={`/client-side/entity/${currentUserFromClientSide.properties._id}`}>
                                    <IconButtonWithPopover popoverText={i18next.t('entitiesTableOfTemplate.navigateToEntityPage')}>
                                        <img height="15px" src="/icons/read-more-icon.svg" />
                                    </IconButtonWithPopover>
                                </Link>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            )}
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
                                entityTemplate={usersInfoChildTemplate!.parentTemplate}
                                properties={currentUserFromClientSide.properties}
                                overridePropertiesToShow={overridePropertiesToShow}
                                style={{
                                    flexDirection: 'row',
                                    flexWrap: 'wrap',
                                    columnGap: '20px',
                                    alignItems: 'center',
                                    width: '100%',
                                }}
                                innerStyle={{ width: '32%' }}
                                textWrap
                                mode="normal"
                            />
                        </Grid>
                        <Grid container item justifyContent="space-between" paddingTop="25px">
                            <EntityDates
                                createdAt={currentUserFromClientSide.properties.createdAt}
                                updatedAt={currentUserFromClientSide.properties.updatedAt}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </>
    );
};

export default UserInfoCard;
