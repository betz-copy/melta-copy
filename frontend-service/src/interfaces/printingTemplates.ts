export interface IPrintSection {
    categoryId: string;
    entityTemplateId: string;
    selectedColumns: string[];
}

export interface IPrintingTemplate {
    name: string;
    sections: IPrintSection[];
    compactView: boolean;
    addEntityCheckbox: boolean;
    appendSignatureField: boolean;
}

export interface IMongoPrintingTemplate extends IPrintingTemplate {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}
