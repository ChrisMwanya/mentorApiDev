const nodemailer = require("nodemailer");

module.exports = {
  /**
   * Sends an email to the recipient in the body of the request
   */
  send: async (ctx) => {
    const body = ctx.request.body;
    const sendTo = body.email;

    strapi.log.debug(`Trying to send an email to ${sendTo}`);

    try {
      const emailOptions = {
        to: sendTo,
        subject: "This is a test",
        html: `<h1>Welcome!</h1><p>This is a test HTML email.</p>`,
      };

      const info = await strapi.plugins["email"].services.email.send(
        emailOptions
      );

      strapi.log.debug(`Email sent to ${sendTo}`);
      ctx.send({ message: "Email sent", info });
    } catch (err) {
      strapi.log.error(`Error sending email to ${sendTo}`, err);
      ctx.send({ error: "Error sending email" });
    }
  },

  resetPassWord: async (ctx) => {
    const body = ctx.request.body;
    const sendTo = body.email;

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SMTP_HOST,
        port: process.env.EMAIL_SMTP_PORT,
        secure: false,
        auth: {
          user: process.env.EMAIL_SMTP_USER,
          pass: process.env.EMAIL_SMTP_PASS,
        },
      });

      const message = await transporter.sendMail({
        from: process.env.EMAIL_ADDRESS_FROM,
        to: sendTo,
        subject: "Changement de mot de passe",
        text: "Hello World",
        html: "<h1> Hello World</h1>",
      });

      strapi.log.debug(`Email sent to ${sendTo}`);
      ctx.send({ message: "Email sent", message });
    } catch (error) {
      strapi.log.error(`Error sending email to ${sendTo}`, error);
      ctx.send({ error: "Error sending email" });
    }
  },
};
