import React from 'react';
import { IMongoChildEntityTemplatePopulated } from '../../../interfaces/entityChildTemplates';
import { IEntity } from '../../../interfaces/entities';
import TemplateTablesView from '../../../common/EntitiesPage/TemplateTablesView';

interface IUserEntityTablesProps {
    childTemplates: IMongoChildEntityTemplatePopulated[];
    currentUserFromSimba: IEntity;
}

const UserEntityTables: React.FC<IUserEntityTablesProps> = ({ childTemplates, currentUserFromSimba }) => {
    return (
        <>
            <TemplateTablesView
                templates={childTemplates.map((template) => template.fatherTemplateId)}
                searchInput={''}
                pageType={'simba'}
                semanticSearch={false}
                setUpdatedEntities={() => {}}
            />
        </>
    );
};

export default UserEntityTables;
