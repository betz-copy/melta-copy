import React from 'react';
import { FilterListOffOutlined } from '@mui/icons-material';
import i18next from 'i18next';
import IconButtonWithPopover from '../IconButtonWithPopover';
import { EntitiesTableOfTemplateRef } from '../EntitiesTableOfTemplate';

const ResetFilterButton: React.FC<{
    entitiesTableRef: React.RefObject<EntitiesTableOfTemplateRef<any>>;
    disableButton: boolean;
}> = ({ entitiesTableRef, disableButton }) => {
    const buttonColor = disableButton ? 'disabled' : 'primary';

    return (
        <IconButtonWithPopover
            iconButtonProps={{ onClick: () => entitiesTableRef.current?.resetFilter() }}
            popoverText={i18next.t('entitiesTableOfTemplate.resetFilters')}
            disabled={disableButton}
        >
            <FilterListOffOutlined color={buttonColor} fontSize="medium" />
        </IconButtonWithPopover>
    );
};

export { ResetFilterButton };
