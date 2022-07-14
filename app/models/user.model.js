module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define("user", {
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      slackId: {
        type: Sequelize.STRING,
      },
      role: {
        type: Sequelize.ENUM("ADMIN", "PROJECT_MANAGER", "ENGINEER"),
        allowNull: false,
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      }
    });

    return User;
};