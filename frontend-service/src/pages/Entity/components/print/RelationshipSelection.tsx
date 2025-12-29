import { CircularProgress, Typography } from '@mui/material';
import i18next from 'i18next';
import { FC, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import Tree from '../../../../common/Tree';
import { environment } from '../../../../globals';
import { IEntityExpanded } from '../../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../../interfaces/entityTemplates';
import { IRelationShipSelectionTree } from '../../../../interfaces/printingTemplates';
import { BackendConfigState } from '../../../../services/backendConfigService';
import { getRelationshipSelectTreeForPrint } from '../../../../services/entitiesService';
import { useUserStore } from '../../../../stores/user';
import { getAllAllowedEntities } from '../../../../utils/permissions/templatePermissions';

const { maxPrintLevel, neoIdsPathSeparator, relationshipPathSeparator, neoRelIdsSeparator } = environment.print;

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
            getRelationshipSelectTreeForPrint(
                rootEntityId,
                { [rootEntityId]: { maxLevel: maxPrintLevel } },
                { templateIds: allowedEntityTemplatesIds },
            ),

        enabled: !!rootEntityId,
    });

    const getSelectedEntitiesCountById = useMemo(() => {
        const map = new Map<string, number>();
        const stack = relationShips ? [...relationShips] : [];

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
            <Typography fontSize={'12px'}>
                {`${i18next.t('entityPage.print.limits.alreadySelected')}: ${selectedEntitiesCount} (${i18next.t(
                    'entityPage.print.limits.max',
                )} ${maxEntitiesToPrint})`}
            </Typography>

            <Tree
                treeItems={relationShips}
                getItemId={(item) => `${item.neoRelIds.join(neoRelIdsSeparator)}${neoIdsPathSeparator}${item.path}`}
                getItemLabel={(item) =>
                    `${item.displayName} (${item.sourceEntity.displayName} > ${item.destinationEntity.displayName}) – ${item.entitiesCount}`
                }
                removeDivider
                selectedItems={selectedTreeItemIds}
                selectionPropagation={{ descendants: true, parents: false }}
                onSelectItems={(itemIds) => {
                    const selectedIds = new Set(itemIds as string[]);

                    if (selectedIds.size > selectedTreeItemIds.length) {
                        for (const selectedId of selectedIds) {
                            const path = selectedId.split(neoIdsPathSeparator).slice(1).join(neoIdsPathSeparator);
                            const pathSegments = path.split(relationshipPathSeparator);

                            for (let i = 1; i < pathSegments.length; i++) {
                                const parentPath = pathSegments.slice(0, i).join(relationshipPathSeparator);
                                const parentNode = allNodes.find((node) => node.path === parentPath);
                                parentNode && selectedIds.add(`${parentNode.neoRelIds}${neoIdsPathSeparator}${parentNode.path}`);
                            }
                        }
                    }

                    const finalSelection = [...selectedIds];
                    const totalCount = finalSelection.reduce((sum, id) => sum + (getSelectedEntitiesCountById.get(id) ?? 0), 0);

                    if (totalCount > maxEntitiesToPrint) {
                        toast.error(i18next.t('entityPage.print.limits.warning'));
                    } else {
                        setSelectedEntitiesCount(totalCount);
                        setSelectedTreeItemIds(finalSelection);
                        setSelectedRelationShipIds([
                            ...new Set(finalSelection.flatMap((id) => id.split(neoIdsPathSeparator)[0]?.split(neoRelIdsSeparator) ?? [])),
                        ]);
                    }
                }}
            />
        </>
    );
};

export default RelationshipSelection;
