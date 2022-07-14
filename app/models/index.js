const dbConfig = require("../config/db.config.js");
const Sequelize = require("sequelize");
const sequelize = new Sequelize(process.env.DATABASE_DB, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
  host: process.env.DATABASE_HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: 0,
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle
  }
});

const db = {};

// build all database models
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.users = require("./user.model.js")(sequelize, Sequelize);
db.projects = require("./project.model.js")(sequelize, Sequelize);
db.entries = require("./entry.model.js")(sequelize, Sequelize);

// build all database assocations
db.users.hasMany(db.entries, {foreignKey: 'userId'});
db.projects.hasMany(db.entries, {foreignKey: 'projectId'});
db.users.belongsToMany(db.projects, { through: 'users_projects' });
db.projects.belongsToMany(db.users, { through: 'users_projects' });

module.exports = db;