"use strict";

const { sanitizeEntity } = require("strapi-utils");

module.exports = {
  index: async (ctx) => {
    const { identifier, password } = ctx.request.body;

    if (!identifier || !password || password.length < 8) {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.email.provide",
          message: "Svp entrer un email.",
        })
      );
    }

    const user = await strapi
      .query("user", "users-permissions")
      .findOne({ email: identifier });

    const newPassword = await strapi.plugins[
      "users-permissions"
    ].services.user.hashPassword({ password });

    const userUpdated = await strapi
      .query("user", "users-permissions")
      .update(
        { id: user.id },
        { resetPasswordToken: null, password: newPassword, active: true }
      );

    // Return new jwt token
    return {
      jwt: strapi.plugins["users-permissions"].services.jwt.issue({
        id: user.id,
      }),
      user: sanitizeEntity(user.toJSON ? user.toJSON() : user, {
        model: strapi.query("user", "users-permissions").model,
      }),
    };
  },

  findUserByEmail: async (ctx) => {
    const { identifier } = ctx.params;
    console.log("identifier", ctx.params);
    const user = await strapi
      .query("user", "users-permissions")
      .findOne({ email: identifier });

    return user.active;
  },
};
