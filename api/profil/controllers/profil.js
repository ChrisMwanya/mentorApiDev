"use strict";

const { sanitizeEntity } = require("strapi-utils");

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

  async putProfil(ctx) {
    const { data, userId, profilId, profilImage } = ctx.request.body;

    const { firstName, lastName, bio, portfolioLink, linkedinProfil } = data;

    await strapi
      .query("user", "users-permissions")
      .update(
        { id: userId },
        {
          firstname: firstName,
          lastname: lastName,
          photo_link: profilImage,
        }
      )
      .then(
        async () =>
          await strapi.query("Profil").update(
            { id: profilId },
            {
              bio,
              link_portfolio: portfolioLink,
              link_linkedin: linkedinProfil,
            }
          )
      );

    const profil = await strapi
      .query("user", "users-permissions")
      .model.find({ id: userId });
    ctx.send({ message: "Email sent", profil });
  },

  async uploadFilePdf(ctx) {
    const { data, profilId } = ctx.request.body;
    const { cvFile, lmFile, pdiFile } = data;

    try {
      await strapi
        .query("Profil")
        .update(
          { id: profilId },
          {
            cv: cvFile,
            lettre_motivation: lmFile,
            pdi: pdiFile,
          }
        )
        .then((response) => ctx.send({ response }))
        .catch((error) => console.log(error));
    } catch (error) {
      strapi.log.error(`Error `, error);
    }
  },
};
