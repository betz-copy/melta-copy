import { IMongoChildTemplateWithConstraintsPopulated } from '@packages/child-template';
import { IEntity } from '@packages/entity';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import { cloneDeep, debounce } from 'lodash';
import { Dispatch, SetStateAction, useCallback, useMemo } from 'react';
import { v4 as uuid } from 'uuid';
import { environment } from '../../../../globals';
import { IPropertyValue } from '../../../../interfaces/entities';
import { useDraftIdStore, useDraftsStore } from '../../../../stores/drafts';
import { EntityWizardValues } from '..';

const useDraftEntityDialogHook = (
    entityTemplate: IMongoEntityTemplateWithConstraintsPopulated | IMongoChildTemplateWithConstraintsPopulated,
    setInitialValuePropsToFilter: Dispatch<SetStateAction<Record<string, IPropertyValue>>>,
    entityToUpdate: IEntity | undefined,
) => {
    const drafts = useDraftsStore((state) => state.drafts);
    const createOrUpdateDraft = useDraftsStore((state) => state.createOrUpdateDraft);
    const deleteDraft = useDraftsStore((state) => state.deleteDraft);

    const draftId = useDraftIdStore((state) => state.draftId);
    const setDraftId = useDraftIdStore((state) => state.setDraftId);

    const originalDrafts = useMemo(() => cloneDeep(drafts), [drafts]);

    const currentDraft = useMemo(
        () => drafts[entityTemplate.category._id]?.[entityTemplate._id]?.find(({ uniqueId }) => uniqueId === draftId),
        [drafts, entityTemplate._id, entityTemplate.category._id, draftId],
    );

    const createOrUpdateDraftDebounced = useCallback(
        debounce((newValues: EntityWizardValues, newDraftId: string) => {
            let uniqueDraftId = newDraftId;

            if (!newDraftId) {
                const createdDraftId = uuid();
                setDraftId(createdDraftId);
                uniqueDraftId = createdDraftId;
            }

            const filterProperties = {
                ...newValues.properties,
                disabled: newValues.properties.disabled ?? false,
            };

            createOrUpdateDraft(
                newValues.template.category._id,
                newValues.template._id,
                { ...newValues, properties: filterProperties, entityId: entityToUpdate?.properties._id },
                uniqueDraftId,
            );
            setInitialValuePropsToFilter({ ...newValues.properties });
        }, environment.draftAutoSaveDebounce),
        [],
    );

    return [deleteDraft, currentDraft, originalDrafts, createOrUpdateDraftDebounced, draftId] as const;
};

export default useDraftEntityDialogHook;
