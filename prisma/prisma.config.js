require("dotenv").config();

module.exports = {
  datasources: {
    db: {
      url: `file:${process.cwd()}/dev.db`,
    },
  },
};
