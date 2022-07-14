const users = require("./app/controllers/user.controller.js");
const db = require("./app/models");
const pgtools = require('pgtools');

let buildTestData = async () => {
  let user1 = await db.users.create({ 
    email: "admin@email.com.dev",
    role: 'ADMIN',
    active: true,
  });
  let user2 = await db.users.create({ 
    email: "pm@email.com.dev",
    role: 'PROJECT_MANAGER',
    active: true,
  });
  let user3 = await db.users.create({ 
    email: "engineer@email.com.dev",
    role: 'ENGINEER',
    active: true,
  });

  let project1 = await db.projects.create({
    name: "Project 1",
    description: 'Sample development project',
    active: true,
  });

  user2.addProject(project1);
  user3.addProject(project1);

  let entry1 = await db.entries.create({
    projectId: project1.id,
    userId: user2.id,
    content: "This is a sample project journal log entry.",
  });
  let entry2 = await db.entries.create({
    projectId: project1.id,
    userId: user3.id,
    content: "This is another sample project journal log entry.",
  });
}

let confirmDestroyAll = async function(){
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('This will destroy all of your database data. If you are sure this is something you would like to do, please type YES to continue. ', async (confirm) => {
    if(confirm === 'YES'){
      await setup();
    } else {
      console.log('YES was not typed; exiting script without making any changes.')
    }
    readline.close();
  });
}

let setup = async function(){
  const config = {
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    port: 5432,
    host: process.env.DATABASE_HOST
  }
  pgtools.createdb(config, process.env.DATABASE_DB, function (err, res) {
    if (err) {
      if(err.name !== 'duplicate_database'){
        process.exit(1);
      }
      console.log('Database already exists, no need to create.')
    } else {
      console.log('Database creatd successfully.');
    }
  });

  await db.sequelize.sync({ force: true });
  console.log("Drop and re-sync db.");

  var args = process.argv.slice(2);
  if(args[0] == '--seedData'){
    let result = await buildTestData();
    console.log("Test data loaded.");
  }

  process.exit(0);
}

confirmDestroyAll();
