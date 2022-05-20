"use strict";

const { default: createStrapi } = require("strapi");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async getStudent(ctx) {
    const userType = await strapi
      .query("User-type")
      .findOne({ type: "Student" });

    const studentReponse = await strapi
      .query("user", "users-permissions")
      .model.find({ user_type: userType.id });

    return studentReponse;
  },
};
