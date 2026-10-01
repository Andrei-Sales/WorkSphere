const bcrypt = require("bcrypt");

const password = "temporary-hash-123";

bcrypt.hash(password, 12).then((hash) => {
  console.log(hash);
});
