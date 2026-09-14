let testing = false;
function isTesting() {
  return testing;
}
function setTesting(value) {
  testing = Boolean(value);
}

export { isTesting, setTesting };
