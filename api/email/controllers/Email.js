const nodemailer = require("nodemailer");
const {
  jwtSecret,
} = require("../../../extensions/users-permissions/config/jwt");

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
    const { email, url } = ctx.request.body;
    const sendTo = email;

    try {
      const user = await strapi
        .query("user", "users-permissions")
        .model.find({ email: sendTo });

      if (user.length < 1) {
        ctx.response.notFound("E-mail not found ", sendTo);
      } else {
        const urlResetPassword =
          url + "?code=" + jwtSecret + "&user=" + user[0].id;
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
          subject: "Mentor4Job : Réinitialisation Mot De Passe",

          html: `<h1>Réinitialisation Mot De Passe</h1>
             <p>Bonjour,</p>
             <p>Quelqu'un a demandé un nouveau mot de passe pour votre compte Kinshasa Digital Academy</p>

             <p>Veuillez cliquer sur ce <a href=${urlResetPassword} target="_blank">lien </a> </p>

             <p>Si vous n'avez pas fait cette demande, alors vous pouvez ignorer cet email 🙂 .</p>
             `,
        });

        strapi.log.debug(`Email sent to ${sendTo}`);
        ctx.send({ message: "Email sent", message });
      }
    } catch (error) {
      strapi.log.error(`Error sending email to ${sendTo}`, error);
      ctx.send({ error: "Error sending email" });
    }
  },
};
