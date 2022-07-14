module.exports = (sequelize, Sequelize) => {
    const Entry = sequelize.define("entrie", {
      projectId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
    });

    return Entry;
};