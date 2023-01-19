const templates = require('./templates.json');

const createRequiredCommandsForEachTemplate = templates.map(template => {
    const createRequiredCommands = template.properties.required.map(requiredProp => {
        const constraintName = `requiredConstraint_${template._id}_${requiredProp}`;

        return `CREATE CONSTRAINT \`${constraintName}\` ON (n:\`${template._id}\`) ASSERT exists(n.${requiredProp})`
    });
    return createRequiredCommands.join(';\n');
}).join(';\n\n');

console.log(createRequiredCommandsForEachTemplate);