"use strict";

/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 *
 * See more details here: https://strapi.io/documentation/developer-docs/latest/setup-deployment-guides/configurations.html#bootstrap
 */

module.exports = () => {
  const io = require("socket.io")(strapi.server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT"],
      allowedHeaders: ["my-custom-header"],
      credentials: true,
    },
  });

  io.on("connection", function (socket) {
    console.log("connected", socket.id);
    socket.on("student-scan-code", ({ qrCodeResult, userName }) => {
      console.log("server received = ", userName, qrCodeResult);
      io.emit("validate-user-attendance", { qrCodeResult, userName });
    });
    // socket.on("validate-user-attendance");
    socket.on("cose validate to student", ({ attendanceQrCodeValue }) => {
      console.log("server received qr code attendance", attendanceQrCodeValue);
      io.emit("code validate to student", { attendanceQrCodeValue });
    });
  });
};
