var mydb = db.getSiblingDB('entity-manager');

var result = mydb['entity-templates'].find({});

print(JSON.stringify(result.toArray(), null, 4));
