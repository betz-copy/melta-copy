export interface TemplateNamesAndId {
    Value: string;
    Name: string;
}

export interface FlowProperties {
    Name: string;
    DisplayName: string;
    Type: string;
    OntologyType: string;
    isRequired?: boolean;
    Description?: string;
    IsSingleValue?: boolean;
    Options?: Array<any>;
}
