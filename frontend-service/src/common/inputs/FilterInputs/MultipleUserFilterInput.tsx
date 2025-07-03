import React from 'react';
import { UserArrayInput } from '../UserArrayInput';
import { IAGGridSetFilter } from '../../../utils/agGrid/interfaces';
import { useDarkModeStore } from '../../../stores/darkMode';
import { IUser } from '../../../interfaces/users';

interface MultipleUserFilterInputProps {
    filterField: IAGGridSetFilter | undefined;
    inputValue: string;
    setInputValue: React.Dispatch<React.SetStateAction<string>>;
    handleCheckboxChange: (option: string | IUser, checked: boolean) => void;
    readOnly: boolean;
    isUsersArray?: boolean;
    isError?: boolean;
    helperText?: string;
}

const MultipleUserFilterInput: React.FC<MultipleUserFilterInputProps> = ({
    filterField,
    inputValue,
    setInputValue,
    handleCheckboxChange,
    readOnly,
    isError,
    helperText,
    isUsersArray = false,
}) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    return (
        <UserArrayInput
            mode="external"
            value={null}
            label=""
            onChange={(_e, chosenUser, reason) => {
                if (reason !== 'selectOption' || !chosenUser) return;
                handleCheckboxChange(isUsersArray ? chosenUser : chosenUser.fullName, true);

                setInputValue('');
            }}
            isError={Boolean(isError)}
            helperText={helperText}
            displayValue={inputValue}
            onDisplayValueChange={(_, newDisplayValue) => setInputValue(newDisplayValue)}
            currentUsers={filterField?.values as string[]}
            onRemove={(index) => {
                const currentUser = filterField?.values[index];
                handleCheckboxChange(currentUser as string, false);
                return undefined;
            }}
            overrideSx={{
                '& .MuiInputBase-root': {
                    borderRadius: '7px',
                    backgroundColor: darkMode ? '#4949499e' : 'white',
                },
                '& .MuiInputBase-input': {
                    color: ' rgba(83, 86, 110, 1)',
                    fontSize: '14px',
                    fontWeight: '400',
                },
                '& fieldset': {
                    borderColor: '#CCCFE5',
                    color: '#CCCFE5',
                },
                '& label': {
                    color: '#9398C2',
                },
            }}
            readOnly={readOnly}
        />
    );
};

export { MultipleUserFilterInput };
