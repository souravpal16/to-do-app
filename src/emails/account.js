const sendgrid = require("@sendgrid/mail");

const myEmail = "rishi18454@gmail.com";

// we use environment variable that we set in the .env file in config folder
sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

// send welcome mail
const sendWelcomeMail = (userEmail, name) => {
  let nameCapped = name.split("");
  nameCapped[0] = nameCapped[0].toUpperCase();
  nameCapped = nameCapped.join("");

  sendgrid.send({
    to: userEmail,
    from: myEmail,
    subject: `Welcome to Todo App`,
    text: `Hey ${nameCapped}, thanks for choosing as us your task management web app. We are glad to serve you. We hope that we will make you a better version of yourselves`,
  });
};

const sendGoodByeEMail = (userEmail, name) => {
  let nameCapped = name.split("");
  nameCapped[0] = nameCapped[0].toUpperCase();
  nameCapped = nameCapped.join("");

  sendgrid.send({
    to: userEmail,
    from: myEmail,
    subject: `We are sad to know that you are leaving`,
    text: `Hey ${nameCapped}, Your account has been successfully removed from our database. We would appreciate if you could spend a few minutes to provide us the reasons that you decided to delete your account, so that we can improve our services for future users`,
  });
};

module.exports = {
  sendWelcomeMail,
  sendGoodByeEMail,
};
