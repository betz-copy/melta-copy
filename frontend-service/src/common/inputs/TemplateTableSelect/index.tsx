import { Box, FormControl, FormHelperText, FormLabel } from '@mui/material';
import { IEntity } from '@packages/entity';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import { PermissionScope } from '@packages/permission';
import React, { useEffect, useState } from 'react';
import DashedSelectBox from './dashedSelectBox';
import DeletableEntityViewerCard from './deletableEntityViewerCard';
import EntitiesTableOfTemplateWithQuickFilter from './EntitiesTableOfTemplateWithQuickFilter';

const TemplateTableSelect: React.FC<{
    entityTemplate?: IMongoEntityTemplateWithConstraintsPopulated;
    value: IEntity | null;
    onChange: (entity: IEntity | null) => void;
    onBlur?: React.FocusEventHandler<HTMLDivElement>;
    label: string;
    error?: boolean;
    helperText?: string;
    hideNonPreview?: boolean;
    autoLoad?: boolean;
    addNewEntityLabel?: string;
    checkUsersPermissions: PermissionScope;
}> = ({
    entityTemplate,
    value,
    onChange,
    onBlur,
    label,
    error,
    helperText,
    hideNonPreview,
    autoLoad = false,
    addNewEntityLabel,
    checkUsersPermissions,
}) => {
    const [isSelectBoxEntityClicked, setIsSelectBoxEntityClicked] = useState(autoLoad);

    useEffect(() => {
        // if no entityTemplate, return to DashedSelectBox with disabled message
        if (!entityTemplate) setIsSelectBoxEntityClicked(false);
        else if (autoLoad) setIsSelectBoxEntityClicked(true);
    }, [entityTemplate, autoLoad]);

    const shouldShowDashedSelectBox = !value && (!isSelectBoxEntityClicked || !entityTemplate);

    return (
        <FormControl variant="outlined" error={error} sx={{ display: 'block' }}>
            {!shouldShowDashedSelectBox && <FormLabel>{label}</FormLabel>}
            <Box
                sx={{ display: 'flex', '& > *': { flex: 1 }, alignItems: 'stretch', minHeight: 350 }}
                tabIndex={0}
                onBlur={(event) => {
                    // blur only if clicked outside of box
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                        onBlur?.(event);
                    }
                }}
            >
                {value && (
                    <Box
                        sx={{
                            // todo: fix this ugly `display: 'flex', '& > *': { flex: 1 }`
                            display: 'flex',
                            '& > *': { flex: 1 },
                            alignItems: 'stretch',
                            border: 'solid',
                            borderColor: error ? 'error.main' : 'primary.main',
                            padding: 1,
                        }}
                    >
                        <DeletableEntityViewerCard
                            entity={value}
                            onDelete={() => {
                                onChange(null);
                                setIsSelectBoxEntityClicked(false);
                            }}
                        />
                    </Box>
                )}
                {shouldShowDashedSelectBox && (
                    <DashedSelectBox
                        text={label}
                        addNewEntityLabel={addNewEntityLabel}
                        checkUsersPermissions={checkUsersPermissions}
                        onClick={() => setIsSelectBoxEntityClicked(true)}
                        minHeight="100%"
                        entityTemplate={entityTemplate}
                        onSuccessCreate={onChange}
                    />
                )}
                {!value && isSelectBoxEntityClicked && entityTemplate && (
                    <Box sx={{ paddingTop: 1, border: 'solid', borderColor: error ? 'error.main' : 'primary.main' }}>
                        <EntitiesTableOfTemplateWithQuickFilter
                            entityTemplate={entityTemplate}
                            onRowSelected={onChange}
                            hideNonPreview={hideNonPreview}
                        />
                    </Box>
                )}
            </Box>
            {helperText && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl>
    );
};

export default TemplateTableSelect;
