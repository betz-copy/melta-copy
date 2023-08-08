import React, { useState } from 'react';
import { Card, CardContent, CardHeader, Collapse, Grid, IconButton } from '@mui/material';
import {
    AppRegistration as AppRegistrationIcon,
    ReadMore as ReadMoreIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { NavLink } from 'react-router-dom';
import { CustomIcon } from '../../../common/CustomIcon';
import { IEntity } from '../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { EntityProperties } from '../../../common/EntityProperties';
import { EntityDisableCheckbox } from '../../Entity/components/EntityDisableCheckbox';
import { EntityDates } from '../../Entity/components/EntityDates';
import { BlueTitle } from '../../../common/BlueTitle';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import i18next from 'i18next';

interface EntityCardProps {
    entity: IEntity;
    entityTemplate: IMongoEntityTemplatePopulated;
    openCard?: boolean;
    customActionButton?: {
        icon: React.ReactNode;
        onClick: () => void;
        popoverText?: string;
    };
    userHavePermission?: boolean;
    customCardStyle?: React.CSSProperties;
    variant?: 'outlined' | 'elevation';
}
const EntityCard: React.FC<EntityCardProps> = ({
    entity,
    openCard = true,
    customActionButton,
    entityTemplate,
    userHavePermission = true,
    customCardStyle,
    variant = 'outlined',
}) => {
    const [open, setOpen] = useState<boolean>(openCard);

    const [hideFields, setHideFields] = React.useState(true);

    return (
        // todo: move card to common (used by "Entity Page" too)
        <Card raised variant={variant} sx={{ overflowX: 'auto', borderRadius: '15px', ...customCardStyle }}>
            <CardHeader
                avatar={
                    <Grid>
                        {entityTemplate.iconFileId ? (
                            <CustomIcon iconUrl={entityTemplate.iconFileId} height="40px" width="40px" />
                        ) : (
                            <AppRegistrationIcon sx={{ fontSize: '40px' }} />
                        )}
                    </Grid>
                }
                action={
                    <Grid container>
                        {entityTemplate.properties.hide.length > 0 && open && (
                            <IconButton
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setHideFields((curr) => !curr);
                                }}
                                size="large"
                            >
                                {hideFields ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                        )}
                        {open ? (
                            <>
                                <NavLink
                                    onClick={(e) => {
                                        if (!userHavePermission) e.preventDefault();
                                    }}
                                    to={`/entity/${entity.properties._id}`}
                                >
                                    <IconButtonWithPopover
                                        popoverText={i18next.t('permissions.dontHavePermissionToEntityPage')}
                                        iconButtonProps={{
                                            size: 'large',
                                            disabled: !userHavePermission,
                                        }}
                                        disabledToolTip={userHavePermission}
                                        disabled={!userHavePermission}
                                    >
                                        <ReadMoreIcon
                                            style={{
                                                transform: 'scaleX(-1)',
                                            }}
                                        />
                                    </IconButtonWithPopover>
                                </NavLink>
                                <IconButton size="large" onClick={() => setOpen(!open)}>
                                    <KeyboardArrowUpIcon />
                                </IconButton>
                            </>
                        ) : (
                            <IconButton size="large" onClick={() => setOpen(!open)}>
                                <KeyboardArrowDownIcon />
                            </IconButton>
                        )}

                        {customActionButton &&
                            (customActionButton.popoverText ? (
                                <IconButtonWithPopover
                                    popoverText={customActionButton.popoverText!}
                                    iconButtonProps={{
                                        size: 'large',
                                        onClick: (event) => {
                                            event.stopPropagation();
                                            customActionButton.onClick();
                                        },
                                    }}
                                >
                                    {customActionButton.icon}
                                </IconButtonWithPopover>
                            ) : (
                                <IconButton
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        customActionButton.onClick();
                                    }}
                                    size="large"
                                >
                                    {customActionButton.icon}
                                </IconButton>
                            ))}
                    </Grid>
                }
                title={<BlueTitle title={entityTemplate.displayName} component="h5" variant="h5" />}
                subheader={entityTemplate.category.displayName}
                // subheaderTypographyProps={{ variant: 'h6' }}
                sx={{ '& .MuiCardHeader-action': { marginRight: '0px' } }} // default is -8px
            />

            <Collapse in={open} style={{ transformOrigin: '0 0 0' }} {...(entity ? { timeout: 500 } : {})} mountOnEnter unmountOnExit>
                <CardContent>
                    <EntityProperties entityTemplate={entityTemplate} properties={entity.properties} hideFields={hideFields} />
                    <Grid container>
                        <EntityDisableCheckbox isEntityDisabled={entity.properties.disabled} />
                    </Grid>
                    <EntityDates createdAt={entity.properties.createdAt} updatedAt={entity.properties.updatedAt} />
                </CardContent>
            </Collapse>
        </Card>
    );
};

export default EntityCard;
