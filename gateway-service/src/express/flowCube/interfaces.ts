export interface IFlowAutoComplete {
    Value: string;
    Name: string;
}

export interface FlowParameters {
    Name: string;
    DisplayName: string;
    Type: string;
    OntologyType: string | null;
    isRequired?: string;
    Description?: string;
    IsSingleValue?: string;
    Options?:
        | {
              Name: string;
              Value: string;
          }[]
        | undefined;
}

export interface FlowFields {
    Name: string;
    DisplayName: string;
    Type: string;
    OntologyType: string | null;
}
