export const generateBasicFunctions = (functionNames: string[], templateName: string) =>
    functionNames.flatMap((fnName) => [`function ${fnName}(${templateName}:${templateName}): void {`, '', '}', '']).join('\n');
