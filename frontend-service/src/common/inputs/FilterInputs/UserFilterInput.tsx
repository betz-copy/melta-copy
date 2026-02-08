import { FormControlLabel, Grid } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { ByCurrentDefaultValue } from '../../../interfaces/childTemplates';
import { IGraphFilterBody } from '../../../interfaces/entities';
import { IKartoffelUserStringFields } from '../../../interfaces/users';
import { IAGGridDateFilter, IAGGridNumberFilter, IAGGridTextFilter } from '../../../utils/agGrid/interfaces';
import MeltaCheckbox from '../../MeltaDesigns/MeltaCheckbox';
import { serializeUser } from '../JSONSchemaFormik/Widgets/RjsfUserArrayWidget';
import { UserInput } from '../UserInput';

interface UserFilterProps {
    filterField: IAGGridTextFilter | undefined;
    handleFilterTypeChange: (
        newTypeFilter: IAGGridDateFilter['type'] | IAGGridTextFilter['type'] | IAGGridNumberFilter['type'],
        condition?: boolean,
    ) => void;
    handleFilterFieldChange: (value: IGraphFilterBody['filterField'], condition?: boolean) => void;
    hideFilterType?: boolean;
    forceEqualsType?: boolean;
}

const UserFilterInput: React.FC<UserFilterProps> = ({ filterField, handleFilterTypeChange, handleFilterFieldChange, forceEqualsType = false }) => {
    const byCurrentUserDefaultValue = filterField?.filter === ByCurrentDefaultValue.byCurrentUser;

    const [currentUser, setCurrentUser] = useState(() => {
        if (!filterField?.filter) return undefined;

        return byCurrentUserDefaultValue ? ByCurrentDefaultValue.byCurrentUser : JSON.parse(filterField.filter);
    });

    useEffect(() => {
        if (forceEqualsType && filterField && filterField.type !== 'equals') handleFilterTypeChange('equals');
    }, [forceEqualsType, filterField, handleFilterTypeChange]);

    return (
        <Grid container flexDirection="column" spacing={1}>
            <Grid>
                <UserInput
                    label=""
                    value={
                        currentUser
                            ? { _id: currentUser._id, displayName: `${currentUser.fullName} - ${currentUser.hierarchy}`, ...currentUser }
                            : undefined
                    }
                    currentUser={{ value: currentUser, set: setCurrentUser }}
                    handleOnChange={(user: IKartoffelUserStringFields | null, _values?: { _id: string; displayName: string }) =>
                        handleFilterFieldChange({
                            ...filterField,
                            filter: user ? serializeUser(user) : undefined,
                        } as IAGGridTextFilter)
                    }
                    isError={false}
                    disabled={byCurrentUserDefaultValue}
                    readOnly={byCurrentUserDefaultValue}
                />
            </Grid>
            <Grid>
                <FormControlLabel
                    control={
                        <MeltaCheckbox
                            checked={byCurrentUserDefaultValue}
                            onChange={(e) => {
                                if (e.target.checked)
                                    handleFilterFieldChange({ ...filterField, filter: ByCurrentDefaultValue.byCurrentUser } as IAGGridTextFilter);
                                else handleFilterFieldChange({ ...filterField, filter: undefined } as IAGGridTextFilter);

                                setCurrentUser(undefined);
                            }}
                            sx={{ marginLeft: 0.5 }}
                        />
                    }
                    label={i18next.t('childTemplate.connectedUser')}
                    slotProps={{
                        typography: { sx: { fontSize: '14px' } },
                    }}
                />
            </Grid>
        </Grid>
    );
};

export { UserFilterInput };
