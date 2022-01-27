export interface ICategory {
    name: string;
    displayName: string;
}

export interface IMongoCategory extends ICategory {
    _id: string;
}

export interface IEntityTemplate {
    name: string;
    displayName: string;
    properties: {
        type: 'object';
        properties: { [n: string]: { type: 'string' | 'number' | 'boolean'; title: string; fromat?: string } };
        required: string[];
    };
    category: IMongoCategory['_id'];
}

export interface IEntityTemplatePopulated {
    name: string;
    displayName: string;
    properties: {
        type: 'object';
        properties: { [n: string]: { type: 'string' | 'number' | 'boolean'; title: string; fromat?: string } };
        required: string[];
    };
    category: IMongoCategory;
}

export interface IMongoEntityTemplate extends IEntityTemplate {
    _id: string;
}

export interface IMongoEntityTemplatePopulated extends IEntityTemplatePopulated {
    _id: string;
}

export interface IEntityInstance {
    _id: string;
    templateId: string;
    categroyId: string;
    properties: object;
}
