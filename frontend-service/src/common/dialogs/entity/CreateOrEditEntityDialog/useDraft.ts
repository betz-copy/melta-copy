import { Dispatch, SetStateAction, useCallback, useMemo } from 'react';
import { cloneDeep, debounce } from 'lodash';
import { v4 as uuid } from 'uuid';
import { useDraftIdStore, useDraftsStore } from '../../../../stores/drafts';
import { EntityWizardValues } from '..';
import { environment } from '../../../../globals';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { IEntity } from '../../../../interfaces/entities';
import { IMongoChildTemplatePopulated } from '../../../../interfaces/childTemplates';

const useDraftEntityDialogHook = (
    entityTemplate: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated,
    setInitialValuePropsToFilter: Dispatch<SetStateAction<object>>,
    signaturePrefix: string,
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
                ...Object.fromEntries(
                    Object.entries(newValues.properties).filter(([_key, value]) => typeof value === 'string' && !value.startsWith(signaturePrefix)),
                ),
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
