export interface TemplateNamesAndId {
    Value: string;
    Name: string;
}

export interface FlowParameter {
    $name: string;
    Name: string;
    ColumnName: string;
    isRequired: boolean;
    DisplayName: string;
    Description: string;
    IsSingleValue: boolean;
    option: Array<any>;
    IsContains: boolean;
}

export interface Attribute {
    $name: string;
    Name: string;
}

export interface FlowField {
    $name: string;
    Name: string;
    DisplayName: string;
    Type: string;
    Attributes: Attribute[];
}
