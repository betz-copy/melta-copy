import { useQuery, useQueryClient } from 'react-query';
import Tree from '../../../../common/Tree';
import { IEntityExpanded } from '../../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../../interfaces/entityTemplates';
import { ITreeNode } from '../../../../interfaces/printingTemplates';
import { getExpandedEntityByIdRequest } from '../../../../services/entitiesService';
import { useUserStore } from '../../../../stores/user';
import { getAllAllowedEntities } from '../../../../utils/permissions/templatePermissions';

const NewRelationShipSelection: React.FC<{
    expandedEntity: IEntityExpanded;
}> = ({ expandedEntity }) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const currentUser = useUserStore((state) => state.user);

    const allowedEntityTemplates = getAllAllowedEntities(Array.from(entityTemplates.values()), currentUser);
    const allowedEntityTemplatesIds = allowedEntityTemplates.map((entity) => entity._id);

    const templateIds = [...entityTemplates.keys()];

    const { data: relationShips } = useQuery<ITreeNode[]>({
        queryKey: ['getExpandedEntity', expandedEntity.entity.properties._id, { templateIds }],
        queryFn: () =>
            getExpandedEntityByIdRequest(
                expandedEntity.entity.properties._id,
                { [expandedEntity.entity.properties._id]: { maxLevel: 4 } }, // TODO: put in config
                { disabled: false, templateIds: allowedEntityTemplatesIds, isOnlyTemplateIds: true },
            ),
    });

    return relationShips ? (
        <Tree
            treeItems={relationShips}
            getItemId={({ _id, parentId, depth }) => `${_id}${parentId}${depth}`}
            getItemLabel={({ sourceEntity, destinationEntity, displayName }) =>
                `${displayName} (${sourceEntity.displayName} > ${destinationEntity.displayName})`
            }
            removeDivider
        />
    ) : (
        <></>
    );
};

export default NewRelationShipSelection;
