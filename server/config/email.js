
require("dotenv").config();

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

module.exports = transporter;

transporter.verify((error, success) => {
  if (error) {
    console.error("Gmail connection failed:", error.message);
  } else {
    console.log("Gmail connection successful!");
  }
});