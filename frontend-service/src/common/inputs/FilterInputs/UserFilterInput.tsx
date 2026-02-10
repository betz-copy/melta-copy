import { FormControlLabel, Grid } from '@mui/material';
import { ByCurrentDefaultValue } from '@packages/child-template';
import { serializeUser } from '@packages/entity';
import { BasicFilterOperationTypes, IAgGridDateFilter, IAgGridNumberFilter, IAgGridTextFilter } from '@packages/rule-breach';
import { IKartoffelUserStringFields } from '@packages/user';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { IGraphFilterBody } from '../../../interfaces/graphFilter';
import MeltaCheckbox from '../../MeltaDesigns/MeltaCheckbox';
import { UserInput } from '../UserInput';

interface UserFilterProps {
    filterField: IAgGridTextFilter | undefined;
    handleFilterTypeChange: (
        newTypeFilter: IAgGridDateFilter['type'] | IAgGridTextFilter['type'] | IAgGridNumberFilter['type'],
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
        if (forceEqualsType && filterField && filterField.type !== BasicFilterOperationTypes.equals)
            handleFilterTypeChange(BasicFilterOperationTypes.equals);
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
                        } as IAgGridTextFilter)
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
                                handleFilterFieldChange({
                                    ...filterField,
                                    filter: e.target.checked ? ByCurrentDefaultValue.byCurrentUser : undefined,
                                } as IAgGridTextFilter);

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
