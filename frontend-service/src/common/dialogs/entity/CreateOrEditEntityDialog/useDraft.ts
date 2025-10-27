import { cloneDeep, debounce } from 'lodash';
import { Dispatch, SetStateAction, useCallback, useMemo } from 'react';
import { v4 as uuid } from 'uuid';
import { EntityWizardValues } from '..';
import { environment } from '../../../../globals';
import { IMongoChildTemplatePopulated } from '../../../../interfaces/childTemplates';
import { IEntity } from '../../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { useDraftIdStore, useDraftsStore } from '../../../../stores/drafts';

const useDraftEntityDialogHook = (
    entityTemplate: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated,
    setInitialValuePropsToFilter: Dispatch<SetStateAction<object>>,
    entityToUpdate: IEntity | undefined,
) => {
    const drafts = useDraftsStore((state) => state.drafts);
    const createOrUpdateDraft = useDraftsStore((state) => state.createOrUpdateDraft);
    const deleteDraft = useDraftsStore((state) => state.deleteDraft);

    const draftId = useDraftIdStore((state) => state.draftId);
    const setDraftId = useDraftIdStore((state) => state.setDraftId);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const originalDrafts = useMemo(() => cloneDeep(drafts), []);

    const currentDraft = useMemo(
        () => drafts[entityTemplate.category._id]?.[entityTemplate._id]?.find(({ uniqueId }) => uniqueId === draftId),
        [drafts, entityTemplate._id, entityTemplate.category._id, draftId],
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
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
