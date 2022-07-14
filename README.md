# project-journal-backend

simple web app for tracking status notes across multiple projects

## requirements
- direnv
- asdf
- postgresql

## setup
- run `asdf install`
- create a database called `project_journal` on your localhost postgresql install
- copy `.envrc.sample` to `.envrc` and fill in all environment variable values
- replace postgresql variable values in `./app/config/db.config.js` if necessary

## database setup
### WARNING: Running anything in this section will remove all current database data
- run `node setup.js` to drop and rebuild the database
- run `node setup.js --seedData` to drop, rebuild, and seed the database

## lint
- run `npm run lint`

## run
- run `node server.js`
- access at http://localhost:3001
