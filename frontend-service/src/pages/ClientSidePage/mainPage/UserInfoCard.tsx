import { AppRegistration as DefaultEntityTemplateIcon } from '@mui/icons-material';
import { Card, CardContent, Grid, useTheme } from '@mui/material';
import { IMongoChildTemplateWithConstraintsPopulated } from '@packages/child-template';
import { IEntity } from '@packages/entity';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import i18next from 'i18next';
import React from 'react';
import { Link } from 'wouter';
import { CustomIcon } from '../../../common/CustomIcon';
import { EntityProperties } from '../../../common/EntityProperties';
import { EntityTemplateColor } from '../../../common/EntityTemplateColor';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import BlueTitle from '../../../common/MeltaDesigns/BlueTitle';
import { useDarkModeStore } from '../../../stores/darkMode';
import { useWorkspaceStore } from '../../../stores/workspace';
import { getEntityTemplateColor } from '../../../utils/colors';
import { EntityDates } from '../../Entity/components/EntityDates';

interface IUserInfoCardProps {
    currentUserFromClientSide: IEntity;
    usersInfoChildTemplate: IMongoChildTemplateWithConstraintsPopulated;
    overridePropertiesToShow?: string[];
    displayTitle?: boolean;
}

const UserInfoCard: React.FC<IUserInfoCardProps> = ({
    currentUserFromClientSide,
    usersInfoChildTemplate,
    overridePropertiesToShow,
    displayTitle = true,
}) => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const theme = useTheme();

    const usersInfoTemplate = usersInfoChildTemplate.parentTemplate;
    const entityTemplateColor = getEntityTemplateColor(usersInfoTemplate as unknown as IMongoEntityTemplateWithConstraintsPopulated);
    const { height, width } = workspace!.metadata!.iconSize!;

    return (
        <>
            {displayTitle && (
                <Grid container justifyContent="space-between" width="100%">
                    <Grid container justifyContent="space-between" width="100%">
                        <Grid container size={{ xs: 5 }} alignItems="center" minWidth="fit-content" gap="10px">
                            <Grid minWidth="fit-content">
                                <EntityTemplateColor entityTemplateColor={entityTemplateColor} />
                            </Grid>
                            <Grid minWidth="fit-content" sx={{ display: 'flex', justifyContent: 'center', alignContent: 'center' }}>
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
                            <Grid minWidth="fit-content" style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
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
                        <Grid>
                            <Grid>
                                <Link href={`/client-side/entity/${currentUserFromClientSide.properties._id}`}>
                                    <IconButtonWithPopover popoverText={i18next.t('entitiesTableOfTemplate.navigateToEntityPage')}>
                                        <img height="15px" src="/icons/read-more-icon.svg" alt="read-more" />
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
                    <Grid container flexDirection="column" flexWrap="nowrap" padding="20px">
                        <Grid height="40%">
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
                                coloredFields={currentUserFromClientSide.coloredFields}
                            />
                        </Grid>
                        <Grid container justifyContent="space-between" paddingTop="25px">
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
