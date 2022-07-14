const db = require("../models");
const User = db.users;
const Project = db.projects;
const Entry = db.entries;
const sequelize = db.sequelize;

// todo: move to shared location
let getUser = async function(userId){
  const [results, metadata] = await sequelize.query('SELECT * FROM users WHERE id = :userId', {replacements: { userId: userId }});
  return results[0];
}

let isMemberOfProject = async function(userId, projectId){
  const [results, metadata] = await sequelize.query('SELECT * FROM users_projects WHERE "userId" = :userId AND "projectId" = :projectId', {replacements: { userId: userId, projectId: projectId }});
  return results.length === 1;
}

exports.findAll = async (req, res) => {
  const user = await getUser(req.user.dbUser.id);

  try {
    let query = 'SELECT * FROM projects AS p JOIN users_projects AS up ON up."projectId" = p.id WHERE up."userId" = :userId';
    // todo: use enum
    if(user.role === "ADMIN"){
      query = `SELECT * FROM projects`;
    }
    const [results, metadata] = await sequelize.query(query, {replacements: { userId: user.id }});
    res.send(results);
  } catch (e) {
    console.error(e);
    res.status(500).send({
      message: `Unable to retrieve Projects: ${e.message}`,
    });
  }
};

exports.find = async (req, res) => {
  if (!req.params.projectId) {
    res.status(400).send({
      message: "Project ID must be provided",
    });
    return;
  }
  const projectId = req.params.projectId;

  const user = await getUser(req.user.dbUser.id);
  // todo: use enum
  if(user.role !== "ADMIN"){
    let member = await isMemberOfProject(user.id, req.params.projectId);
    if(!member){
      res.status(403).send();
      return;
    }
  }

  try {
    const [projects] = await sequelize.query(
      'SELECT * FROM projects WHERE id = :projectId'
      , {replacements: { projectId: projectId}});
    let project = projects[0];
    const [entries] = await sequelize.query(
      'SELECT e.*, u.email AS "userEmail" FROM projects p JOIN entries e ON p.id = e."projectId" JOIN users u ON e."userId" = u.id WHERE p.id = :projectId', {replacements: { projectId: projectId }}
    );
    project.entries = entries;
    res.send(project);
  } catch (e) {
    console.error(e);
    res.status(500).send({
      message: `Unable to retrieve Project with id=${projectId}: ${e.message}`,
    });
  }
};

exports.create = async (req, res) => {
  const user = await getUser(req.user.dbUser.id);

  // todo: enum
  if(!(user.role == "ADMIN" || user.role == "PROJECT_MANAGER")){
    res.status(403).send();
    return;
  }

  if (!req.body.name) {
    res.status(400).send({
      message: "Name cannot be empty",
    });
    return;
  }
  if (!req.body.description) {
    res.status(400).send({
      message: "Description cannot be empty",
    });
    return;
  }

  const project = {
    name: req.body.name,
    description: req.body.description,
    active: true,
  };

  const t = await sequelize.transaction();
  try {
    let data = await Project.create(project);
    if(user.role !== "ADMIN"){
      const [results, metadata] = await sequelize.query('INSERT INTO users_projects ("createdAt", "updatedAt", "userId", "projectId") VALUES (NOW(), NOW(), :userId, :dataId)', {replacements: { userId: user.id, dataId: data.id }});
    }
    await t.commit();

    res.send(data);
  } catch (e) {
    await t.rollback();
    console.error(e);
    res.status(500).send({
      message: `Unable to create Project: ${e.message}`,
    });
  }
};

exports.createEntry = async (req, res) => {
  const user = await getUser(req.user.dbUser.id);

  try {
    if (!req.params.projectId) {
      res.status(400).send({
        message: "Project ID cannot be empty",
      });
      return;
    }
    if (!req.body.userId) {
      res.status(400).send({
        message: "User ID cannot be empty",
      });
      return;
    }
    if (!req.body.content) {
      res.status(400).send({
        message: "Content cannot be empty",
      });
      return;
    }

    // todo: use enum
    if(user.role !== "ADMIN"){
      let member = await isMemberOfProject(user.id, req.params.projectId);
      if(!member){
        res.status(403).send();
        return;
      }
    }

    const t = await sequelize.transaction();
  try {
    const entry = {
      projectId: req.params.projectId,
      userId: req.body.userId,
      content: req.body.content,
    };
    let data = await Entry.create(entry);
    const [results, metadata] = await sequelize.query('UPDATE projects SET "updatedAt" = NOW() WHERE id = :projectId', {replacements: { projectId: req.params.projectId }});
    await t.commit();

    res.send(data);
  } catch (e) {
    await t.rollback();
    console.error(e);
    res.status(500).send({
      message: `Unable to create Project: ${e.message}`,
    });
  }

  } catch (e) {
    console.error(e);
    res.status(500).send({
      message: `Unable to create Entry: ${e.message}`,
    });
  }
};

exports.findUsers = async (req, res) => {
  const user = await getUser(req.user.dbUser.id);
  // todo: use enum
  if(user.role === "ENGINEER"){
    res.status(403).send();
    return;
  }

  // todo: use enum
  if(user.role !== "ADMIN"){
    let member = await isMemberOfProject(user.id, req.params.projectId);
    if(!member){
      res.status(403).send();
      return;
    }
  }

  try {
    let query = 'SELECT u.* FROM users AS u JOIN users_projects AS up ON u.id = up."userId" WHERE up."projectId" = :projectId';
    const [results, metadata] = await sequelize.query(query, {replacements: { projectId: req.params.projectId }});
    res.send(results);
  } catch (e) {
    console.error(e);
    res.status(500).send({
      message: `Unable to retrieve Projects: ${e.message}`,
    });
  }
};

exports.createUser = async (req, res) => {
  const user = await getUser(req.user.dbUser.id);

  // todo: enum
  if(!(user.role == "ADMIN" || user.role == "PROJECT_MANAGER")){
    res.status(403).send();
    return;
  }

  if (!req.body.userId) {
    res.status(400).send({
      message: "Name cannot be empty",
    });
    return;
  }

  try {
    const [results, metadata] = await sequelize.query('INSERT INTO users_projects ("createdAt", "updatedAt", "userId", "projectId") VALUES (NOW(), NOW(), :userId, :projectId)', {replacements: { userId: user.id, projectId: req.params.projectId }});

    res.send(true);
  } catch (e) {
    console.error(e);
    res.status(500).send({
      message: `Unable to create Project: ${e.message}`,
    });
  }
};

exports.getProjectsDashboard = async (req, res) => {
  const user = await getUser(req.user.dbUser.id);

  // todo: use enum
  if(user.role !== "ADMIN"){
    res.status(403).send();
    return;
  }

  try {
    let projects = [];
    const [projectResults] = await sequelize.query(
      'SELECT * FROM projects');
    for(let project of projectResults){
      const [entries] = await sequelize.query(
        'SELECT e.*, u.email AS "userEmail" FROM projects p JOIN entries e ON p.id = e."projectId" JOIN users u ON e."userId" = u.id WHERE p.id = :projectId ORDER BY e."updatedAt" DESC LIMIT 1', {replacements: { projectId: project.id }}
      );
      project.entries = entries;
      projects.push(project);
    }
    res.send(projects);
  } catch (e) {
    console.error(e);
    res.status(500).send({
      message: `Unable to retrieve Project with id=${projectId}: ${e.message}`,
    });
  }
};
