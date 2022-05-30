module.exports = ({ env }) => ({
  email: {
    provider: "nodemailer",
    providerOptions: {
      host: "smtp.sendgrid.net",
      port: 587,
      auth: {
        user: "apiKey",
        pass: "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",
      },
    },
    settings: {
      defaultFrom: "francois@kinshasadigital.com",
      defaultReplyTo: "francois@kinshasadigital.com",
    },
  },
});
