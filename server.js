const express = require("express");
const users = require("./app/controllers/user.controller.js");
const projects = require("./app/controllers/project.controller.js");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const session = require('express-session');
const db = require("./app/models");

var environment = process.env.NODE_ENV

var corsOptions = {
  origin: process.env.CORS_URL,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

if (environment === 'production'){
app.use(session({
  resave: false,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  proxy: true,
  cookie: {
    maxAge: 600000,
    secure: true,
    httpOnly: true,
    sameSite: 'none',
  },
}));
} else {
  app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET,
  }));
}

const passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

var GoogleAuthCodeStrategy = require('passport-google-authcode').Strategy;
  passport.use(new GoogleAuthCodeStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "postmessage",
  },
  async function(accessToken, refreshToken, profile, done) {
    const email = profile.emails[0].value;
    var result = await users.find(email);
    if(result.length === 0){
      // todo: use enum
      await users.createDirect(email, "ENGINEER");
      result = await users.find(email);
    }
    profile.dbUser = result[0];
    return done(null, profile);
  }
));

const isLoggedIn = (req, res, next) => {
  if (req.user) {
      next();
  } else {
      res.sendStatus(401);
  }
}

db.sequelize.sync()
.then(() => {
  console.log("Synced db.");
})
.catch((err) => {
  console.log("Failed to sync db.");
  throw err;
});

app.get("/", isLoggedIn, (req, res) => {
  res.json({ message: "Project Journal API" });
});

app.get("/users", isLoggedIn, async (req, res) => {
  await users.findAllActive(req, res);
});

app.post("/users", isLoggedIn, async (req, res) => {
  await users.create(req, res);
});

app.get('/dashboard', isLoggedIn, async function(req, res) {
  await projects.getProjectsDashboard(req, res);
});

app.get('/projects', isLoggedIn, async function(req, res) {
  await projects.findAll(req, res);
});

app.post('/projects', isLoggedIn, async (req, res) => {
  await projects.create(req, res);
});

app.get("/projects/:projectId", isLoggedIn, async (req, res) => {
  await projects.find(req, res);
});

app.post("/projects/:projectId/entries", isLoggedIn, async (req, res) => {
  await projects.createEntry(req, res);
});

app.get("/projects/:projectId/users", isLoggedIn, async (req, res) => {
  await projects.findUsers(req, res);
});

app.post("/projects/:projectId/users", isLoggedIn, async (req, res) => {
  await projects.createUser(req, res);
});
 
app.post('/login', 
  passport.authenticate('google-authcode'),
  function(req, res) {
    if(req.user){
      res.send(req.user);
    } else {
      res.status(500).send({
        message: `Unable to authenticate user`,
      });
    }
});

app.post('/logout', function(req, res){
  // todo: logout not working
  req.logout();
  req.session.destroy();
  res.send(true);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});