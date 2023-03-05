const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
app.use(express.json());

const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbpath = path.join(__dirname, "userData.db");
let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};

initializeDbAndServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const selectUserQuery = `
    SELECT * 
    FROM 
        user 
    WHERE username = '${username}'`;
  const dbresponseObject = await database.get(selectUserQuery);
  if (dbresponseObject === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUserQuery = `
            INSERT INTO user (username, name, password, gender, location)
            VALUES ('${username}','${name}','${hashedPassword}','${gender}','${location}')`;
      const dbresponse = await database.run(createUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
    SELECT * 
    FROM 
        user 
    WHERE username = '${username}'`;
  const dbresponseObject = await database.get(selectUserQuery);
  if (dbresponseObject === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatch = await bcrypt.compare(
      password,
      dbresponseObject.password
    );
    if (isPasswordMatch === false) {
      response.status(400);
      response.send("Invalid password");
    } else {
      response.status(200);
      response.send("Login success!");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `
    SELECT * 
    FROM 
        user 
    WHERE username = '${username}'`;
  const dbresponseObject = await database.get(selectUserQuery);
  const isPasswordMatch = await bcrypt.compare(
    oldPassword,
    dbresponseObject.password
  );
  if (isPasswordMatch === true) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const newpassworddetails = await bcrypt.hash(newPassword, 10);
      const updatePasswordQuery = `
                UPDATE user
                SET
                    password = '${newpassworddetails}'
                WHERE username = '${username}';`;
      await database.run(updatePasswordQuery);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});
module.exports = app;
