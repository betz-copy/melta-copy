import { FilterList, FilterListOff } from '@mui/icons-material';
import { useTheme } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { IEntity } from '../../interfaces/entities';
import { useDarkModeStore } from '../../stores/darkMode';
import { EntitiesTableOfTemplateRef } from '../EntitiesTableOfTemplate';
import IconButtonWithPopover from '../IconButtonWithPopover';

const ResetFilterButton: React.FC<{
    entitiesTableRef: React.RefObject<EntitiesTableOfTemplateRef<IEntity> | null>;
    disableButton: boolean;
}> = ({ entitiesTableRef, disableButton }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const theme = useTheme();

    const disabledColor = darkMode ? 'rgba(255, 255, 255, 0.26)' : 'rgba(0, 0, 0, 0.26)';

    return (
        <IconButtonWithPopover
            iconButtonProps={{ onClick: () => entitiesTableRef.current?.resetFilter() }}
            popoverText={i18next.t('entitiesTableOfTemplate.resetFilters')}
            disabled={disableButton}
            style={{
                display: 'flex',
                gap: '0.25rem',
                borderRadius: '5px',
                fontSize: '0.75rem',
                color: disableButton ? disabledColor : theme.palette.primary.main,
            }}
        >
            {disableButton ? <FilterList fontSize="small" /> : <FilterListOff fontSize="small" />}
            {i18next.t('entitiesTableOfTemplate.resetFilters')}
        </IconButtonWithPopover>
    );
};

export { ResetFilterButton };
