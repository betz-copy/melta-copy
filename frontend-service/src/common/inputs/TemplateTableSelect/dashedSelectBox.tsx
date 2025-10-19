import { Grid } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { IEntity } from '../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { PermissionScope } from '../../../interfaces/permissions';
import { useUserStore } from '../../../stores/user';
import { checkUserTemplatePermission } from '../../../utils/permissions/instancePermissions';
import { AddIconWithText } from '../../AddIconWithText';
import { AddEntityButton } from '../../EntitiesPage/Buttons/AddEntity';
import IconButtonWithPopover from '../../IconButtonWithPopover';

const DashedSelectBox: React.FC<{
    text: string;
    checkUsersPermissions: PermissionScope;
    onClick: React.MouseEventHandler<HTMLDivElement>;
    error?: boolean;
    entityTemplate?: IMongoEntityTemplatePopulated;
    minHeight: React.CSSProperties['minHeight'];
    onSuccessCreate: (entity: IEntity) => void;
    addNewEntityLabel?: string;
}> = ({ text, checkUsersPermissions, onClick, error, minHeight, entityTemplate, onSuccessCreate, addNewEntityLabel }) => {
    const disabledReasonAnchorRef = React.useRef<HTMLParagraphElement>(null);
    const borderColorTheme = error ? 'error' : 'primary';

    const currentUser = useUserStore((state) => state.user);

    const userHasPermissions = !entityTemplate
        ? undefined
        : checkUserTemplatePermission(
              currentUser.currentWorkspacePermissions,
              entityTemplate.category._id,
              entityTemplate._id,
              checkUsersPermissions,
          );

    const disabled = !entityTemplate || userHasPermissions === false;

    let popoverText: string;
    if (!entityTemplate) {
        popoverText = i18next.t('templateTableSelect.disabledReasonMustChooseTemplate');
    } else if (!userHasPermissions) {
        popoverText = i18next.t('permissions.dontHaveWritePermissions');
    } else {
        popoverText = i18next.t('entitiesTableOfTemplate.selectEntity');
    }

    return (
        <div>
            <Grid
                container
                justifyContent="center"
                alignItems="center"
                sx={{
                    border: 'dashed',
                    ':hover': { borderColor: `${borderColorTheme}.main` },
                    borderColor: `${borderColorTheme}.light`,
                    cursor: 'pointer',
                    minHeight,
                }}
            >
                <Grid container justifyContent="center" alignItems="center" spacing={2}>
                    <Grid size={{ xs: 12 }} container display="flex" justifyContent="center">
                        <IconButtonWithPopover popoverText={popoverText} disabled={disabled} style={{ borderRadius: '5px' }}>
                            <AddIconWithText
                                textStyle={{ display: 'flex', alignItems: 'center', fontSize: '19px', fontVariant: 'h4' }}
                                text={text}
                                disabled={disabled}
                                ref={disabledReasonAnchorRef}
                                onClick={onClick}
                            />
                        </IconButtonWithPopover>
                    </Grid>

                    {addNewEntityLabel && (
                        <Grid size={{ xs: 12 }} container display="flex" justifyContent="center">
                            <AddEntityButton
                                initialStep={1}
                                disabled={disabled}
                                popoverText={popoverText}
                                initialValues={
                                    entityTemplate
                                        ? { template: entityTemplate, properties: { disabled: false }, attachmentsProperties: {} }
                                        : undefined
                                }
                                style={{ borderRadius: '5px' }}
                                onSuccessCreate={onSuccessCreate}
                            >
                                <AddIconWithText
                                    textStyle={{ display: 'flex', alignItems: 'center', fontSize: '19px', fontVariant: 'h4' }}
                                    text={addNewEntityLabel}
                                    disabled={disabled}
                                />
                            </AddEntityButton>
                        </Grid>
                    )}
                </Grid>
            </Grid>
        </div>
    );
};

export default DashedSelectBox;
