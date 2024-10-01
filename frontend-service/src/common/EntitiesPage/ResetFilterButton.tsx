import React from 'react';
import i18next from 'i18next';
import IconButtonWithPopover from '../IconButtonWithPopover';
import { EntitiesTableOfTemplateRef } from '../EntitiesTableOfTemplate';
import { IEntity } from '../../interfaces/entities';

const ResetFilterButton: React.FC<{
    entitiesTableRef: React.RefObject<EntitiesTableOfTemplateRef<IEntity> | undefined>;
    disableButton: boolean;
}> = ({ entitiesTableRef, disableButton }) => {
    return (
        <IconButtonWithPopover
            iconButtonProps={{ onClick: () => entitiesTableRef.current?.resetFilter() }}
            popoverText={i18next.t('entitiesTableOfTemplate.resetFilters')}
            disabled={disableButton}
            style={{ borderRadius: '5px' }}
        >
            {disableButton ? <img src="/icons/delete-filters.svg" /> : <img src="/icons/delete-filters-enable.svg" />}
        </IconButtonWithPopover>
    );
};

export { ResetFilterButton };
