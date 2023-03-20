import React from 'react';
import { FilterListOffOutlined } from '@mui/icons-material';
import i18next from 'i18next';
import IconButtonWithPopoverText from '../IconButtonWithPopover';
import { EntitiesTableOfTemplateRef } from '../EntitiesTableOfTemplate';

const ResetFilterButton: React.FC<{
    entitiesTableRef: React.RefObject<EntitiesTableOfTemplateRef<any>>;
}> = ({ entitiesTableRef }) => {
    return (
        <IconButtonWithPopoverText
            iconButtonProps={{ onClick: () => entitiesTableRef.current?.resetFilter() }}
            popoverText={i18next.t('entitiesTableOfTemplate.resetFilters')}
        >
            <FilterListOffOutlined color="primary" fontSize="medium" />
        </IconButtonWithPopoverText>
    );
};

export { ResetFilterButton };
