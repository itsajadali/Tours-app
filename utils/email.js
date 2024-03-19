// eslint-disable-next-line import/no-extraneous-dependencies
const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  //////////////////////////////////
  // ! 1) create transporter

  // * a service to send an gmail
  // * we not gonna use gmail
  // * because it allow us only send 500 email

  const transporter = nodemailer.createTransport({
    // all info are saved in env variable

    // ! to use gmail, you need to activate the less secure app

    // service: "Gmail",
    // auth: {
    //   user: process.env.EMAIL_USERNAME, // generated ethereal user
    //   pass: process.env.EMAIL_PASSWORD, // generated ethereal password
    // },

    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME, // generated ethereal user
      pass: process.env.EMAIL_PASSWORD, // generated ethereal password
    },
  });
  //////////////////////////////////
  // ! 2) create email options

  // options we passed.

  const mailOptions = {
    from: "Sajad ali <sajad42,ali@gmail.com> ",
    to: options.email, // list of receivers
    subject: options.subject, // list of receivers
    text: options.message, // list of receivers
  };

  //////////////////////////////////
  // ! 3) send email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
