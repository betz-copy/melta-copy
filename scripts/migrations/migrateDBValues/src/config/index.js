import env from "env-var";
import "./dotenv.js";

const config = {
  mongo: {
    uri: env.get("MONGO_URI").required().asString(),
    templatesCollection: env.get("TEMPLATES_COLLECTION").required().asString(),
    categoriesCollection: env
      .get("CATEGORIES_COLLECTION")
      .required()
      .asString(),
    configsCollection: env.get("CONFIGS_COLLECTION").required().asString(),
  },
  neo: {
    uri: env.get("NEO_URI").required().asString(),
    user: env.get("NEO_USER").required().asString(),
    password: env.get("PASSWORD").required().asString(),
  },
};

export default config;
