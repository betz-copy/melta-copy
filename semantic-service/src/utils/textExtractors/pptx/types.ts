interface Relationship {
    $: {
        Id: string;
        Type: string;
        Target: string;
    };
}

interface RelationshipsObject {
    Relationship: Relationship[];
}

export interface RelsObject {
    Relationships?: RelationshipsObject;
}

export interface XMLObject {
    [key: string]: string;
}
