"use strict";

const { sanitizeEntity } = require("strapi-utils");

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
    const classAsiduity = getClassAssuidity(ctx);
    return classAsiduity;
  },

  async getAcademyAttendanceRate(ctx) {
    const { academy } = ctx.params;

    const acdemiesResponse = await strapi
      .query("academy")
      .model.findOne({ name: academy });

    let allStudentAttendancesAcademy = [];
    let totalAttendance = 0;
    let totalLateRate = 0;
    let totalAbsentRate = 0;
    let totalPresentRate = 0;

    let studentAttendances = acdemiesResponse.students;

    for (const studentId of studentAttendances) {
      const studentAttendance = await getStudentAssiduity(studentId);

      allStudentAttendancesAcademy.push(studentAttendance);
    }

    if (allStudentAttendancesAcademy.length > 0) {
      allStudentAttendancesAcademy.map((attendanceStudentObject) => {
        totalAttendance =
          totalAttendance + attendanceStudentObject.totalAttendance;
        const lateAttendance = attendanceStudentObject.lateAttendance;
        const absentAttendance = attendanceStudentObject.absentAttendance;
        const presentAttendance = attendanceStudentObject.presentAttendance;

        totalLateRate = totalLateRate + lateAttendance;
        totalAbsentRate = totalAbsentRate + absentAttendance;
        totalPresentRate = totalPresentRate + presentAttendance;
      });

      totalLateRate = parseInt((100 * totalLateRate) / totalAttendance);
      totalAbsentRate = parseInt((100 * totalAbsentRate) / totalAttendance);
      totalPresentRate = parseInt((100 * totalPresentRate) / totalAttendance);
    }

    totalLateRate =
      totalLateRate === NaN || totalLateRate === null ? totalLateRate : 0;
    totalAbsentRate =
      totalAbsentRate === NaN || totalAbsentRate === null ? totalAbsentRate : 0;
    totalPresentRate =
      totalPresentRate === NaN || totalPresentRate === null
        ? totalPresentRate
        : 0;

    return {
      totalLateRate,
      totalAbsentRate,
      totalPresentRate,
    };
  },
  async getAcademyTotalRate(ctx) {
    const allAcademiesResponse = await strapi.query("academy").model.find();
    let totalAttendance = 0;
    let totalLateRate = 0;
    let totalAbsentRate = 0;
    let totalPresentRate = 0;

    for (const academy of allAcademiesResponse) {
      const acdemiesResponse = await strapi
        .query("academy")
        .model.findOne({ name: academy.name });

      let allStudentAttendancesAcademy = [];

      let studentAttendances = acdemiesResponse.students;

      for (const studentId of studentAttendances) {
        const studentAttendance = await getStudentAssiduity(studentId);

        allStudentAttendancesAcademy.push(studentAttendance);
      }

      if (allStudentAttendancesAcademy.length > 0) {
        allStudentAttendancesAcademy.map((attendanceStudentObject) => {
          totalAttendance =
            totalAttendance + attendanceStudentObject.totalAttendance;
          const lateAttendance = attendanceStudentObject.lateAttendance;
          const absentAttendance = attendanceStudentObject.absentAttendance;
          const presentAttendance = attendanceStudentObject.presentAttendance;

          totalLateRate = totalLateRate + lateAttendance;
          totalAbsentRate = totalAbsentRate + absentAttendance;
          totalPresentRate = totalPresentRate + presentAttendance;
        });

        totalLateRate = parseInt((100 * totalLateRate) / totalAttendance);
        totalAbsentRate = parseInt((100 * totalAbsentRate) / totalAttendance);
        totalPresentRate = parseInt((100 * totalPresentRate) / totalAttendance);
      }

    }


    return {
      totalLateRate: !totalLateRate ? 0 : totalLateRate,
      totalAbsentRate: !totalAbsentRate ? 0 : totalAbsentRate,
      totalPresentRate: !totalPresentRate ? 0 : totalPresentRate,
  
    };
  },
};

const getStudentAssiduity = async (studentId) => {
  let totalAttendance = 0;
  let totalLateRate = 0;
  let totalAbsentRate = 0;
  let totalPresentRate = 0;

  const studentAttendance = {};
  const studentAttendancesResponse = await strapi
    .query("attendance")
    .model.find({ user_attendance: studentId });

  const studentName = await strapi
    .query("user", "users-permissions")
    .model.findOne({ _id: studentId });

  studentAttendance.name = studentName.username;
  studentAttendance.attendance = await studentAttendancesResponse.map(
    ({ createdAt, state, half_day }) => ({
      createdAt,
      state,
      half_day,
    })
  );

  studentAttendance.id = studentId;

  if (studentAttendancesResponse.length > 0) {
    totalAttendance =
      totalAttendance + (studentAttendancesResponse.length || 0);
    const absentAttendance = studentAttendancesResponse.filter(
      ({ state, half_day }) => state === "absent" || half_day === true
    );
    const lateAttendance = studentAttendancesResponse.filter(
      ({ state, half_day }) => state === "late" && half_day === false
    );

    const presentAttendance = studentAttendancesResponse.filter(
      ({ state, half_day }) => state === "present" && half_day === false
    );

    totalLateRate = parseInt((100 * lateAttendance.length) / totalAttendance);
    totalAbsentRate = parseInt(
      (100 * absentAttendance.length) / totalAttendance
    );
    totalPresentRate = parseInt(
      (100 * presentAttendance.length) / totalAttendance
    );

    studentAttendance.totalLateRate = totalLateRate;
    studentAttendance.totalAbsentRate = totalAbsentRate;
    studentAttendance.totalPresentRate = totalPresentRate;

    studentAttendance.lateAttendance = parseInt(lateAttendance.length);
    studentAttendance.absentAttendance = parseInt(absentAttendance.length);
    studentAttendance.presentAttendance = parseInt(presentAttendance.length);

    studentAttendance.totalAttendance = totalAttendance;
  } else {
    studentAttendance.totalLateRate = 0;
    studentAttendance.totalAbsentRate = 0;
    studentAttendance.totalPresentRate = 0;

    studentAttendance.lateAttendance = 0;
    studentAttendance.absentAttendance = 0;
    studentAttendance.presentAttendance = 0;

    studentAttendance.totalAttendance = 0;
  }

  return studentAttendance;
};

const getClassAssuidity = async (ctx) => {
  const { name } = ctx.params;
  let allStudentAttendancesClass = [];
  let totalAttendance = 0;
  let totalLateRate = 0;
  let totalAbsentRate = 0;
  let totalPresentRate = 0;

  const studentClass = await strapi.query("class").model.findOne({ name });
  let studentAttendances = await studentClass.student;

  for (const studentId of studentAttendances) {
    const studentAttendance = await getStudentAssiduity(studentId);

    allStudentAttendancesClass.push(studentAttendance);
  }

  if (allStudentAttendancesClass.length > 0) {
    allStudentAttendancesClass.map((attendanceStudentObject) => {
      totalAttendance =
        totalAttendance + attendanceStudentObject.totalAttendance;
      const lateAttendance = attendanceStudentObject.lateAttendance;
      const absentAttendance = attendanceStudentObject.absentAttendance;
      const presentAttendance = attendanceStudentObject.presentAttendance;

      totalLateRate = totalLateRate + lateAttendance;
      totalAbsentRate = totalAbsentRate + absentAttendance;
      totalPresentRate = totalPresentRate + presentAttendance;
    });

    totalLateRate = parseInt((100 * totalLateRate) / totalAttendance);
    totalAbsentRate = parseInt((100 * totalAbsentRate) / totalAttendance);
    totalPresentRate = parseInt((100 * totalPresentRate) / totalAttendance);
  }

  totalLateRate =
    totalLateRate === NaN || totalLateRate === null ? 0 : totalLateRate;
  totalAbsentRate =
    totalAbsentRate === NaN || totalAbsentRate === null ? 0 : totalAbsentRate;
  totalPresentRate =
    totalPresentRate === NaN || totalPresentRate === null
      ? 0
      : totalPresentRate;

  return {
    totalLateRate,
    totalAbsentRate,
    totalPresentRate,
  };
};
