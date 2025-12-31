const express = require("express")
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const databasePath = path.join(__dirname, 'database.db')

const app = express()

app.use(express.json())

let database = null

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })

    app.listen(5000, () =>
      console.log('Server Running at http://localhost:5000/'),
    )
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const validatePassword = password => {
  return password.length > 4
}

app.post('/register', async (request, response) => {
  const {username, password, email} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const selectUserQuery = `SELECT * FROM users WHERE email = '${email}';`
  const databaseUser = await database.get(selectUserQuery)

  if (databaseUser === undefined) {
    const createUserQuery = `
     INSERT INTO
      users (username, password, email)
     VALUES
      (
       '${username}',
       '${hashedPassword}',
       '${email}'
      );`
    if (validatePassword(password)) {
      await database.run(createUserQuery)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})


app.get("/api", async (req, res) => {
    const query = `
    SELECT *
    FROM users;
    `

    const users = await database.all(query)
    res.status(200).json(users)
})

module.exports = app