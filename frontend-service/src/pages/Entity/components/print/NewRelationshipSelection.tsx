import { Dispatch, SetStateAction } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import Tree from '../../../../common/Tree';
import { IConnection, IEntityExpanded } from '../../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../../interfaces/entityTemplates';
import { ITreeNode } from '../../../../interfaces/printingTemplates';
import { getExpandedEntityByIdRequest } from '../../../../services/entitiesService';
import { useUserStore } from '../../../../stores/user';
import { getAllAllowedEntities } from '../../../../utils/permissions/templatePermissions';
import { INestedRelationshipTemplates } from '../..';

export type EntityConnectionsProps = {
    connectionsTemplates: INestedRelationshipTemplates[];
    setConnectionsTemplates: Dispatch<SetStateAction<INestedRelationshipTemplates[]>>;
    setConnectionsInstances: Dispatch<SetStateAction<IConnection[]>>;
    selectedConnections: INestedRelationshipTemplates[];
    setSelectedConnections: Dispatch<SetStateAction<INestedRelationshipTemplates[]>>;
};

const NewRelationShipSelection: React.FC<{
    expandedEntity: IEntityExpanded;
    setSelectedRelationShipIds: React.Dispatch<React.SetStateAction<string[]>>;
}> = ({ expandedEntity, setSelectedRelationShipIds }) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const currentUser = useUserStore((state) => state.user);

    const allowedEntityTemplates = getAllAllowedEntities(Array.from(entityTemplates.values()), currentUser);
    const allowedEntityTemplatesIds = allowedEntityTemplates.map((entity) => entity._id);

    const templateIds = [...entityTemplates.keys()];

    // TODO: isLoading
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
            getItemId={({ mongoAndRelId, depth, sourceEntityId, destinationEntityId }) =>
                `${mongoAndRelId}&${depth}&${sourceEntityId}&${destinationEntityId}`
            }
            getItemLabel={({ sourceEntity, destinationEntity, displayName }) =>
                `${displayName} (${sourceEntity.displayName} > ${destinationEntity.displayName})`
            }
            removeDivider
            onSelectItems={(itemIds) => {
                setSelectedRelationShipIds(itemIds as string[]);
            }}
            selectionPropagation={{ descendants: true, parents: false }}
        />
    ) : (
        <></>
    );
};

export default NewRelationShipSelection;
