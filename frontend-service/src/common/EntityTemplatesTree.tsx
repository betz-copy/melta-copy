import React from 'react';
import FolderTree from 'react-folder-tree';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';

interface EntityTemplatesTreeProps {
    title: string;
    entityTemplates: IMongoEntityTemplatePopulated[];
}

const EntityTemplatesTree: React.FC<EntityTemplatesTreeProps> = ({ title, entityTemplates }) => {
    const testData: any = {
        id: '6767cd16bd9fd100664d50c7',
        name: 'travelAgent',
        children: [
            {
                id: '6767cd16bd9fd100664d50c5',
                name: 'tourist',
                children: [],
            },
        ],
    };

    const test = (nodeData: any) => {
        console.log(nodeData);
    };

    return <FolderTree data={testData} readOnly onNameClick={test} />;
};

export { EntityTemplatesTree };
