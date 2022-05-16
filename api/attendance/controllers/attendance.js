"use strict";

const { sanitizeEntity } = require("strapi-utils");

/*

Create post justification : set id justification on attendance filtered in range

Set Status pending ("waiting validation") on send justifications

Validate justification with message (dates!)

*/

module.exports = {
  async findByValueCode(ctx) {
    const { value_qrcode } = ctx.params;
    const entity = await strapi.query("attendance").model.findOne({
      value_qrcode: value_qrcode,
    });

    return sanitizeEntity(entity, { model: strapi.models.attendance });
  },

  async setJustification(ctx) {
    const { id } = ctx.params;

    const { startDate, endDate, justification } = ctx.request.body;

    const studentAttendance = await strapi
      .query("attendance")
      .model.find({ user_attendance: id });

    let studentAttendanceSelected = studentAttendance.filter((attendance) => {
      const attendanceDate = Date.parse(attendance.attendance_day);
      return attendanceDate >= startDate;
    });

    studentAttendanceSelected = studentAttendanceSelected.filter(
      (attendance) => {
        const attendanceDate = Date.parse(attendance.attendance_day);
        return attendanceDate <= endDate;
      }
    );

    studentAttendanceSelected = studentAttendanceSelected.filter(
      (attendance) =>
        attendance.state === "late" ||
        attendance.state === "absent" ||
        attendance.half_day === true
    );

    studentAttendanceSelected.map(async (attendance) => {
      await strapi.query("attendance").model.updateOne(
        { _id: attendance._id },
        {
          justification,
        }
      );
    });

    return studentAttendanceSelected;
  },

  async createAttendance(ctx) {
    const {
      attendance_day,
      half_day,
      date,
      value_qrcode,
      users_permissions_user,
      user_socket_id,
    } = ctx.request.body;

    const entity = await strapi.query("attendance").model.create({
      attendance_day,
      half_day,
      date,
      value_qrcode,
      users_permissions_user,
      user_socket_id,
    });

    return sanitizeEntity(entity, { model: strapi.models.attendance });
  },

  async findAllAttendanceByDate(ctx) {
    const { date, user } = ctx.params;

    const attendance_day = date;
    const user_attendance = user;

    const entity = await strapi.query("attendance").model.find({
      attendance_day,
      user_attendance,
    });

    return sanitizeEntity(entity, { model: strapi.models.attendance });
  },

  async findAttendanceByDate(ctx) {
    const { date, user } = ctx.params;

    const attendance_day = date;
    const user_attendance = user;

    const entity = await strapi.query("attendance").model.findOne({
      attendance_day,
      user_attendance,
    });

    return sanitizeEntity(entity, { model: strapi.models.attendance });
  },

  async updateAttendance(ctx) {
    const { state, user_attendance, half_day } = ctx.request.body;
    const { id } = ctx.params;

    const entity = await strapi.query("attendance").model.updateOne(
      { _id: id },
      {
        state,
        user_attendance,
        half_day,
      }
    );
    return sanitizeEntity(entity, { model: strapi.models.attendance });
  },

  async setAbsent(ctx) {
    const {
      state,
      user_attendance,
      half_day,
      date,
      users_permissions_user,
      attendance_day,
    } = ctx.request.body;

    const entity = await strapi.query("attendance").model.create({
      state,
      user_attendance,
      half_day,
      date,
      users_permissions_user,
      attendance_day,
    });
    return sanitizeEntity(entity, { model: strapi.models.attendance });
  },

  async findAllStudentAttendance(ctx) {
    const { user } = ctx.params;

    const entity = await strapi.query("attendance").model.find({
      user_attendance: user,
    });

    return sanitizeEntity(entity, { model: strapi.models.attendance });
  },

  async findStudentAttendancesByClass(ctx) {
    const { name } = ctx.params;
    let allStudentAttendancesClass = [];

    const studentClass = await strapi.query("class").model.findOne({ name });
    let studentAttendances = await studentClass.student;

    for (const studentId of studentAttendances) {
      const studentAttendance = {};
      const studentAttendancesResponse = await strapi
        .query("attendance")
        .model.find({ user_attendance: studentId });

      const studentName = await strapi
        .query("user", "users-permissions")
        .model.findOne({ _id: studentId });

      studentAttendance.name = studentName.username;
      studentAttendance.attendance = await studentAttendancesResponse.map(
        ({ createdAt, state, id, attendance_day }) => ({
          createdAt,
          state,
          id,
          attendance_day,
        })
      );
      studentAttendance.id = studentId;

      allStudentAttendancesClass.push(studentAttendance);
    }

    return allStudentAttendancesClass;
  },

  async getClaasAttendanceRate(ctx) {
    const { name } = ctx.params;
    let allStudentAttendancesClass = [];
    let totalAttendance = 0;
    let totalLateRate = 0;
    let totalAbsentRate = 0;
    let totalPresentRate = 0;

    const studentClass = await strapi.query("class").model.findOne({ name });
    let studentAttendances = await studentClass.student;

    for (const studentId of studentAttendances) {
      const studentAttendance = {};
      const studentAttendancesResponse = await strapi
        .query("attendance")
        .model.find({ user_attendance: studentId });

      const studentName = await strapi
        .query("user", "users-permissions")
        .model.findOne({ _id: studentId });

      studentAttendance.name = studentName.username;
      studentAttendance.attendance = await studentAttendancesResponse.map(
        ({ createdAt, state }) => ({
          createdAt,
          state,
        })
      );
      studentAttendance.id = studentId;

      allStudentAttendancesClass.push(studentAttendance);
    }

    allStudentAttendancesClass.map((attendanceStudentObject) => {
      totalAttendance =
        totalAttendance + attendanceStudentObject.attendance.length;
      const lateAttendance = attendanceStudentObject.attendance.filter(
        ({ state }) => state === "late"
      );
      const absentAttendance = attendanceStudentObject.attendance.filter(
        ({ state }) => state === "absent"
      );
      const presentAttendance = attendanceStudentObject.attendance.filter(
        ({ state }) => state === "present"
      );

      totalLateRate = totalLateRate + lateAttendance.length;
      totalAbsentRate = totalAbsentRate + absentAttendance.length;
      totalPresentRate = totalPresentRate + presentAttendance.length;
    });

    return {
      totalAttendance,
      totalLateRate,
      totalAbsentRate,
      totalPresentRate,
    };
  },
};
