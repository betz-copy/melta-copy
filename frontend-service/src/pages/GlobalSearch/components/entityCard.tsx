import React, { useState } from 'react';
import { Card, CardContent, CardHeader, Collapse, Dialog, Grid, IconButton } from '@mui/material';
import { AppRegistration as AppRegistrationIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import i18next from 'i18next';
import { CustomIcon } from '../../../common/CustomIcon';
import { IEntity } from '../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { EntityProperties } from '../../../common/EntityProperties';
import { EntityDisableCheckbox } from '../../Entity/components/EntityDisableCheckbox';
import { EntityDates } from '../../Entity/components/EntityDates';
import { BlueTitle } from '../../../common/BlueTitle';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import { getEntityTemplateColor } from '../../../utils/colors';
import { environment } from '../../../globals';
import { CreateOrEditEntityDetails } from '../../../common/dialogs/entity/CreateOrEditEntityDialog';

interface EntityCardProps {
    entity: IEntity;
    entityTemplate: IMongoEntityTemplatePopulated;
    expandCard?: boolean;
    onExpand?: (entityId: string) => void;
    customActionButton?: {
        icon: React.ReactNode;
        onClick: (event) => void;
        popoverText?: string;
    };
    userHavePermission?: boolean;
    customCardStyle?: React.CSSProperties;
    variant?: 'outlined' | 'elevation';
}
const EntityCard: React.FC<EntityCardProps> = ({
    entity,
    expandCard = false,
    onExpand,
    customActionButton,
    entityTemplate,
    userHavePermission = true,
    customCardStyle,
    variant = 'outlined',
}) => {
    const [open, setOpen] = useState<boolean>(expandCard);

    const [editDialog, setEditDialog] = useState<{
        isOpen: boolean;
        entity?: IEntity;
    }>({
        isOpen: false,
    });

    const navigate = useNavigate();

    const entityTemplateColor = getEntityTemplateColor(entityTemplate);

    const first5PropsKeys: string[] = [
        ...entityTemplate.propertiesPreview.slice(0, 5),
        ...entityTemplate.propertiesOrder
            .filter((property2) => !entityTemplate.propertiesPreview.includes(property2))
            .slice(0, 5 - entityTemplate.propertiesPreview.length),
    ];

    const onOpen = () => {
        if (onExpand) onExpand(entity.properties._id);
        setOpen(!open);
    };

    return (
        <Card raised variant={variant} sx={{ overflowX: 'auto', borderRadius: '15px', ...customCardStyle }}>
            <CardHeader
                style={{ height: '36px', padding: '0px 27px 0px 0px', marginTop: "7px" }}
                title={
                    <Grid container alignItems="center" flexDirection="row" gap="20px">
                        <Grid
                            container
                            alignItems="center"
                            justifyContent="center"
                            width="42px"
                            height="42px"
                            // marginTop="27px"
                            style={{ borderRadius: '100%' }}
                        >
                            {entityTemplate.iconFileId ? (
                                <CustomIcon color={entityTemplateColor} iconUrl={entityTemplate.iconFileId} height="24px" width="24px" />
                            ) : (
                                <AppRegistrationIcon sx={{ fontSize: environment.mainFontSizes.headlineTitleFontSize, color: 'white' }} />
                            )}
                        </Grid>
                        <BlueTitle style={{ width: 'fit-content' }} title={entityTemplate.displayName} component="h6" variant="h6" />
                    </Grid>
                }
                action={
                    <Grid container alignContent="center" alignItems="center">
                        <Grid container item alignContent="center" alignItems="center">
                            <Grid
                                item
                                onClick={(e) => {
                                    if (!userHavePermission) e.preventDefault();
                                    navigate(`/entity/${entity.properties._id}`);
                                }}
                            >
                                <IconButtonWithPopover popoverText={i18next.t('wizard.entity.readMore')}>
                                    <img src="/icons/read-more-icon.svg" />
                                </IconButtonWithPopover>
                            </Grid>
                            <Grid
                                item
                                onClick={() => {
                                    setEditDialog({
                                        isOpen: true,
                                        entity,
                                    });
                                }}
                            >
                                <IconButtonWithPopover popoverText={i18next.t('actions.edit')}>
                                    <img src="/icons/edit-icon.svg" />
                                </IconButtonWithPopover>
                            </Grid>
                            <Grid
                                item
                                onClick={() => {
                                    navigate(`/entity/${entity.properties._id}/graph`);
                                }}
                            >
                                <IconButtonWithPopover popoverText={i18next.t('actions.graph')}>
                                    <img src="/icons/graph-icon.svg" />
                                </IconButtonWithPopover>
                            </Grid>
                            <IconButton size="large" onClick={onOpen}>
                                {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                            </IconButton>
                        </Grid>

                        {customActionButton &&
                            (customActionButton.popoverText ? (
                                <IconButtonWithPopover
                                    popoverText={customActionButton.popoverText!}
                                    iconButtonProps={{
                                        size: 'large',
                                        onClick: (event) => {
                                            event.stopPropagation();
                                            customActionButton.onClick(event);
                                        },
                                    }}
                                >
                                    {customActionButton.icon}
                                </IconButtonWithPopover>
                            ) : (
                                <IconButton
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        customActionButton.onClick(event);
                                    }}
                                    size="large"
                                >
                                    {customActionButton.icon}
                                </IconButton>
                            ))}
                    </Grid>
                }
                sx={{ '& .MuiCardHeader-action': { marginRight: '0px' } }} // default is -8px
            />
            <hr style={{border: "1px solid #EBEFFA", marginLeft: "8px", marginRight: "8px"}}></hr>

            {!open && (
                <Grid container paddingLeft="90px" height="fit-content" minHeight="37px" alignItems="center">
                    <EntityProperties
                        entityTemplate={entityTemplate}
                        properties={entity.properties}
                        overridePropertiesToShow={first5PropsKeys}
                        mode="normal"
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            columnGap: '20px',
                            rowGap: '10px',
                            paddingBottom: '10px',
                            paddingTop: '10px',
                            alignItems: 'center',
                            width: '100%',
                        }}
                        innerStyle={{ width: '310px' }}
                    />
                </Grid>
            )}

            <Collapse in={open} style={{ transformOrigin: '0 0 0' }} {...(entity ? { timeout: 500 } : {})} mountOnEnter unmountOnExit>
                <CardContent
                    style={{
                        padding: '40px 90px 20px 50px',
                    }}
                >
                    <EntityProperties
                        entityTemplate={entityTemplate}
                        properties={entity.properties}
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            rowGap: '20px',
                            alignItems: 'center',
                        }}
                        innerStyle={{ flexBasis: '33.33%' }}
                        textWrap
                        mode="normal"
                    />
                    <Grid container marginTop="20px">
                        <EntityDisableCheckbox isEntityDisabled={entity.properties.disabled} />
                    </Grid>
                    <Grid marginTop="20px">
                        <EntityDates createdAt={entity.properties.createdAt} updatedAt={entity.properties.updatedAt} />
                    </Grid>
                </CardContent>
            </Collapse>
            <Dialog open={editDialog.isOpen} maxWidth="md">
                <CreateOrEditEntityDetails
                    isEditMode
                    entityTemplate={entityTemplate}
                    entity={entity}
                    onSuccessUpdate={() => {
                        setEditDialog((prev) => ({ ...prev, isOpen: false }));
                    }}
                    onCancelUpdate={() => setEditDialog((prev) => ({ ...prev, isOpen: false }))}
                />
            </Dialog>
        </Card>
    );
};

export default EntityCard;
