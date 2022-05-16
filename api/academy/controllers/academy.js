"use strict";

const { sanitizeEntity } = require("strapi-utils");

module.exports = {
  async findAcademyStudents(ctx) {
    const { name } = ctx.params;
    const entity = await strapi.query("academy").model.findOne({
        name,
    });
    const students = entity.students;

    return sanitizeEntity(students, { model: strapi.models.academy });
  },
};
