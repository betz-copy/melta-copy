import { cloneDeep } from 'lodash';
import { v4 as uuid } from 'uuid';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Draft } from '../common/dialogs/entity/draftWarningDialog';

interface DraftIdState {
    draftId: string;
    setDraftId: (draftId: string) => void;
}

export const useDraftIdStore = create<DraftIdState>((set) => ({
    draftId: '',
    setDraftId: (draftId) => set({ draftId }),
}));

export interface DraftsState {
    // ? the type of the drafts in the local storage is this:
    // ? { [categoryId]: { [templateId]: Draft[] } }

    drafts: Record<string, Record<string, Draft[]> | undefined>;
    createOrUpdateDraft: (categoryId: string, templateId: string, draft: Omit<Draft, 'uniqueId' | 'lastSavedAt'>, uniqueId?: string) => void;
    deleteDraft: (categoryId: string, templateId: string, draftId: string) => void;
    setAllDrafts: (drafts: DraftsState['drafts']) => void;
}

const getDraftsCopy = (drafts: DraftsState['drafts'], categoryId: string, templateId: string): DraftsState['drafts'] => {
    const draftsCopy = cloneDeep(drafts);

    if (!(categoryId in draftsCopy)) draftsCopy[categoryId] = {};

    if (!(templateId in draftsCopy[categoryId]!)) draftsCopy[categoryId]![templateId] = [];

    return draftsCopy;
};

export const useDraftsStore = create(
    persist<DraftsState>(
        (set, get) => ({
            drafts: {},
            createOrUpdateDraft: (categoryId, templateId, draft, uniqueId) => {
                const draftsCopy = getDraftsCopy(get().drafts, categoryId, templateId);
                const draftIndex = draftsCopy[categoryId]![templateId].findIndex((value) => value.uniqueId === uniqueId);

                if (draftIndex === -1) draftsCopy[categoryId]![templateId].push({ ...draft, uniqueId: uniqueId ?? uuid(), lastSavedAt: new Date() });
                else draftsCopy[categoryId]![templateId][draftIndex] = { ...draft, uniqueId: uniqueId!, lastSavedAt: new Date() };

                set({ drafts: draftsCopy });
            },
            deleteDraft: (categoryId, templateId, draftId) => {
                const draftsCopy = getDraftsCopy(get().drafts, categoryId, templateId);
                const draftIndex = draftsCopy[categoryId]![templateId].findIndex((value) => value.uniqueId === draftId);

                if (draftIndex === -1) return;

                draftsCopy[categoryId]![templateId].splice(draftIndex, 1);

                set({ drafts: draftsCopy });
            },
            setAllDrafts: (drafts) => set({ drafts }),
        }),
        { name: 'drafts' },
    ),
);
