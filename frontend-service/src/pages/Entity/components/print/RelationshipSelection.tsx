import { CircularProgress, Typography } from '@mui/material';
import i18next from 'i18next';
import { FC, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import Tree from '../../../../common/Tree';
import { IEntityExpanded } from '../../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../../interfaces/entityTemplates';
import { IRelationShipSelectionTree } from '../../../../interfaces/printingTemplates';
import { BackendConfigState } from '../../../../services/backendConfigService';
import { getRelationshipSelectTreeForPrint } from '../../../../services/entitiesService';
import { useUserStore } from '../../../../stores/user';
import { getAllAllowedEntities } from '../../../../utils/permissions/templatePermissions';

interface ITreeNode extends Omit<IRelationShipSelectionTree, 'children'> {
    children?: ITreeNode[];
}

interface RelationshipSelectionProps {
    expandedEntity: IEntityExpanded;
    setSelectedRelationShipIds: (ids: string[]) => void;
}

const RelationshipSelection: FC<RelationshipSelectionProps> = ({ expandedEntity, setSelectedRelationShipIds }) => {
    const [selectedTreeItemIds, setSelectedTreeItemIds] = useState<string[]>([]);
    const [selectedEntitiesCount, setSelectedEntitiesCount] = useState<number>(0);

    const rootEntityId = expandedEntity.entity.properties._id;

    const queryClient = useQueryClient();
    const currentUser = useUserStore((s) => s.user);
    const { maxEntitiesToPrint } = queryClient.getQueryData<BackendConfigState>('getBackendConfig')!;

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const allowedEntityTemplatesIds = useMemo(
        () => getAllAllowedEntities(Array.from(entityTemplates.values()), currentUser).map((e) => e._id),
        [entityTemplates, currentUser],
    );

    const { data: relationShips, isLoading } = useQuery<ITreeNode[]>({
        queryKey: ['getRelationshipSelectTreeForPrint', rootEntityId, { allowedEntityTemplatesIds }],
        queryFn: () =>
            getRelationshipSelectTreeForPrint(rootEntityId, { [rootEntityId]: { maxLevel: 4 } }, { templateIds: allowedEntityTemplatesIds }),

        enabled: !!rootEntityId,
    });

    const getSelectedEntitiesCountById = useMemo(() => {
        const map = new Map<string, number>();
        const stack = [...(relationShips ?? [])];

        while (stack.length) {
            const node = stack.pop()!;
            map.set(`${node.neoRelIds} ${node.path}`, node.entitiesCount);
            if (node.children?.length) stack.push(...node.children);
        }

        return map;
    }, [relationShips]);

    const allNodes = useMemo(
        () =>
            relationShips?.flatMap(function flat(n): ITreeNode[] {
                return [n, ...(n.children?.flatMap(flat) ?? [])];
            }) ?? [],
        [relationShips],
    );

    if (isLoading) return <CircularProgress size={20} />;
    if (!relationShips?.length) return null;

    return (
        <>
            <Typography
                fontSize={'12px'}
            >{`${i18next.t('entityPage.print.limits.alreadySelected')}: ${selectedEntitiesCount} (${i18next.t('entityPage.print.limits.max')} ${maxEntitiesToPrint})`}</Typography>

            <Tree
                treeItems={relationShips}
                getItemId={(item) => `${item.neoRelIds} ${item.path}`}
                getItemLabel={(item) =>
                    `${item.displayName} (${item.sourceEntity.displayName} > ${item.destinationEntity.displayName}) – ${item.entitiesCount}`
                }
                removeDivider
                selectedItems={selectedTreeItemIds}
                selectionPropagation={{ descendants: true, parents: false }}
                onSelectItems={(itemIds) => {
                    const next = new Set(itemIds as string[]);
                    const prevSize = selectedTreeItemIds.length;

                    if (next.size > prevSize) {
                        for (const id of next) {
                            const parts = id.split(' ').slice(1).join(' ').split('&');

                            for (let i = 1; i < parts.length; i++) {
                                const p = allNodes.find((n) => n.path === parts.slice(0, i).join('&'));
                                if (p) next.add(`${p.neoRelIds} ${p.path}`);
                            }
                        }
                    }

                    const final = [...next];
                    const count = final.reduce((s, id) => s + (getSelectedEntitiesCountById.get(id) ?? 0), 0);

                    if (count > maxEntitiesToPrint) {
                        toast.error(i18next.t('entityPage.print.limits.warning'));
                        return;
                    }

                    setSelectedEntitiesCount(count);
                    setSelectedTreeItemIds(final);
                    setSelectedRelationShipIds([...new Set(final.flatMap((id) => id.split(' ')[0]?.split(',') ?? []))]);
                }}
            />
        </>
    );
};

export default RelationshipSelection;
