const db = require("../models");
const User = db.users;
const sequelize = db.sequelize;


// todo: move to shared location
let getUser = async function(userId){
  const [results, metadata] = await sequelize.query('SELECT * FROM users WHERE id = :userId', {replacements: { userId: userId }});
  return results[0];
}

exports.createDirect = async (email, role) => {
  const user = {
    email: email,
    role: role,
    active: true,
  };

  return await User.create(user);
};

exports.create = async (req, res) => {
  const user = await getUser(req.user.dbUser.id);

  // todo: enum
  if(!(user.role == "ADMIN")){
    res.status(403).send();
    return;
  }

  const userProps = {
    email: req.body.email,
    role: req.body.role,
    active: true,
  };

  const t = await sequelize.transaction();
  try {
    let userDb = await User.create(userProps);
    // todo: enum
    if(req.body.projectId !== null && req.body.role != "ADMIN"){
      const [results, metadata] = await sequelize.query('INSERT INTO users_projects ("createdAt", "updatedAt", "userId", "projectId") VALUES (NOW(), NOW(), :userId, :dataId)', {replacements: { userId: userDb.id, dataId: req.body.projectId }});
    }
    await t.commit();

    res.send(userDb);
  } catch (e) {
    await t.rollback();
    console.error(e);
    res.status(500).send({
      message: `Unable to create Project: ${e.message}`,
    });
  }
};

exports.find = async (email) => {
  try {
    const [results, metadata] = await sequelize.query(
      'SELECT * FROM users WHERE email = :email', {replacements: { email: email, }}
    );
    return results;
  } catch (e) {
    console.error(e);
    res.status(500).send({
      message: `Unable to retrieve User with email=${email}: ${e.message}`,
    });
  }
}

exports.findAllActive = async (req, res) => {
  const user = await getUser(req.user.dbUser.id);

  // todo: enum
  if(!(user.role == "ADMIN" || user.role == "PROJECT_MANAGER")){
    res.status(403).send();
    return;
  }
  
  try {
    const [results, metadata] = await sequelize.query(
      "SELECT * FROM users WHERE active = TRUE"
    );
    res.send(results);
  } catch (e) {
    console.error(e);
    res.status(500).send({
      message: `Unable to retrieve active Users: ${e.message}`,
    });
  }
};

exports.update = async (req, res) => {
    const id = req.params.id;
    try {
      let result = await User.update(req.body, {
        where: { id: id }
      });
      if (num == 1) {
        res.send({
          message: "User was updated successfully",
        });
      } else {
        res.status(500).send({
          message: `Cannot update User with id=${id}; User not found or empty`,
        });
      }
    } catch (e) {
      console.error(e);
      res.status(500).send({
        message: `Unable to update User with id=${id}: ${e.message}`,
      });
    }
};