import { MenuItem } from '@mui/material';
import i18next from 'i18next';
import { MenuItemContent } from './MenuItemContent';

export const SelectAll = ({
    allOptionIds,
    selectedOptionIds,
    setSelectedOptionIds,
    onClick,
}: {
    allOptionIds: string[];
    selectedOptionIds: string[];
    setSelectedOptionIds: (ids: string[]) => void;
    onClick?: () => void;
}) => {
    return (
        <MenuItem
            sx={{ width: '100%', height: '24px', padding: '0px', my: '10px' }}
            onClick={() => {
                const prevChecked = allOptionIds.length === selectedOptionIds.length;

                if (prevChecked) setSelectedOptionIds([]);
                else setSelectedOptionIds(allOptionIds);

                onClick?.();
            }}
        >
            <MenuItemContent
                checked={selectedOptionIds.length === allOptionIds.length}
                indeterminate={selectedOptionIds.length < allOptionIds.length && !!selectedOptionIds.length}
                label={i18next.t('selectChooseAll')}
                order={0}
            />
        </MenuItem>
    );
};
