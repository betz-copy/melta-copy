const setIfMissing = (key, value) => {
    if (!process.env[key]) {
        process.env[key] = value;
    }
};

setIfMissing('PORT', '8000');
setIfMissing('MONGO_URL', 'mongodb://localhost:27017/activity-log-test');
setIfMissing('RABBIT_URL', 'amqp://localhost:5672');
setIfMissing('MONGO_ACTIVITIES_COLLECTION_NAME', 'activities');

process.env.ELASTIC_APM_ACTIVE = 'false';
