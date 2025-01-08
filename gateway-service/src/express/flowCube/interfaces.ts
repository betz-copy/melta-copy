export interface TemplateNamesAndId {
    Value: string;
    Name: string;
}

export interface FlowParameters {
    Name: string;
    DisplayName: string;
    Type: string;
    OntologyType: string;
    isRequired?: boolean;
    Description?: string;
    IsSingleValue?: boolean;
    Options?: Array<any>;
}

export interface FlowFields {
    Name: string;
    DisplayName: string;
    Type: string;
    OntologyType: string;
}
