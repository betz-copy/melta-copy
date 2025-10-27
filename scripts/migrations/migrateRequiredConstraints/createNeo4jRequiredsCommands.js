const templates = require('./templates.json');

const createRequiredCommandsForEachTemplate = templates
    .map((template) => {
        const templateId = template._id.$oid;
        const createRequiredCommands = template.properties.required.map((requiredProp) => {
            const constraintName = `requiredConstraint_${templateId}_${requiredProp}`;

            return `CREATE CONSTRAINT \`${constraintName}\` ON (n:\`${templateId}\`) ASSERT exists(n.${requiredProp})`;
        });
        return createRequiredCommands.join(';\n');
    })
    .join(';\n\n');

console.log(createRequiredCommandsForEachTemplate);
