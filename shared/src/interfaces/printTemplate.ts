export interface IPrintSection {
    categoryId: string;
    entityTemplateId: string;
    selectedColumns: string[];
}

export interface IPrintTemplate {
    name: string;
    sections: IPrintSection[];
    compactView: boolean;
    addEntityCheckbox: boolean;
    appendSignatureField: boolean;
}

export interface IMongoPrintTemplate extends IPrintTemplate {
    _id: string;
}
