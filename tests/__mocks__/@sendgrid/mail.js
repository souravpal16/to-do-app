// __mocks__ directory is read by jest to check for mock functions
// we use mocks to override a imported module while testing
// for example, if we run sendgrid module everytime on testing,
// we will send a mail everytime the test runs, which is unneccessary
// and waste o money if the services is paid, or is limited
// hence we override them with mock fnctions
// since the module to override is @sendgrid/mail
// @sendgrid directory=>mail.js file will be read from the __mocks__ directory if there is one
// instead of the actual module

// we only use setApiKey and send method in our project, so we simulate the required behaviour in the below fncs,
// but in this case we dont need these fncns to do anything at all, they should just be called
module.exports = {
  setApiKey() {},
  send() {},
};
