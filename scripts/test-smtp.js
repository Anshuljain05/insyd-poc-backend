require('dotenv').config();
const nodemailer = require('nodemailer');

(async () => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '2525', 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      logger: true,
      debug: true,
    });

    console.log('Using env:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER ? '***' : null,
    });

    await transporter.verify();
    console.log('SMTP verify succeeded');
    process.exit(0);
  } catch (err) {
    console.error('SMTP verify failed:');
    console.error(err && err.stack ? err.stack : err);
    if (err && err.response) console.error('SMTP response:', err.response);
    process.exit(2);
  }
})();
