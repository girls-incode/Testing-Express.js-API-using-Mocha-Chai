# Testing Express.js API using Mocha & Chai

We will write end-to-end (functional) tests for API endpoints which does CRUD operations in Express. This project uses:
- **[Express.js](https://expressjs.com/)** - Node.js web application framework
- **[Mocha](https://mochajs.org/)** - JavaScript test framework running on Node.js and in the browser
- **[Chai](https://www.chaijs.com/)** - BDD / TDD assertion library for node and the browser that can be used with any javascript testing framework
- **[Supertest](https://www.npmjs.com/package/supertest)** - npm module with a high-level abstraction for HTTP testing
- **[MongoDB](https://www.mongodb.com/)** - document-based, distributed NoSQL database
- **[Mongoose](https://mongoosejs.com/)** - MongoDB object modeling for Node.js
- **[body-parser](https://www.npmjs.com/package/body-parser)** - Node.js HTTP request body parsing middleware
- **[nyc](https://www.npmjs.com/package/nyc)** - command-line-client for Istanbul (JavaScript test coverage tool)

### 1. Initialize the project:
```
npm init
```

### 2. Install the required packages:
```
npm install express mocha chai body-parser mongoose supertest nyc
```

### 3. Update the "main" and "scripts" params in package.json like this:
```
{
  "name": "musika",
  "version": "1.0.0",
  "description": "",
  "main": "app.js",
  "scripts": {
    "bat": "pre.bat",
    "cls": "cls || clear",
    "start": "node bin/www",
    "test": "mocha --timeout 11000 --exit",
    "coverage": "npm run bat && nyc --reporter=html --reporter=text npm test"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "body-parser": "^1.19.0",
    "chai": "^4.2.0",
    "express": "^4.17.1",
    "mocha": "^8.1.1",
    "mongoose": "^5.10.0",
    "supertest": "^4.0.2",
    "nyc": "^15.1.0"
  }
}
```
**pre.bat** is a windows batch script that starts the localhost MongoDB server and shell
```shell
@echo off
SET location=%CD%
REM echo %path%
cd "C:\Program Files\MongoDB\Server\4.2\bin"
start call mongod -dbpath c:\data\db
TIMEOUT /T 10
start call mongo
cd %location%
```

Run ```npm bat``` and then in the Mongo shell:

- list your databases: ``` show dbs ```
- create musika database : ``` use musika ```  
- create users table and insert some data:

``` db.users.insert({"name" : "violeta", "email" : "hola@girlsincode.com", "country": "Romania"}) ```
- check if users collection is created: ``` show collections ```
- list users data: ``` db.users.find() ```
- check the current database name, number of collection and documents: 
``` db.stats() ```


The cmd output:

!['mongodb-shell'](img/mongodb-shell.jpg)

Try [MongoDB Compass GUI](https://www.mongodb.com/try/download/compass) if you don't like command line:

!['MongoDB Compass'](img/mongodb-compass-database.jpg)

**bin/www** file creates a httpServer and passes app as the handler (this code could be added in app.js too but it's better to keep it separated):

```shell
#!/usr/bin/env node

let app = require("../app");
let http = require("http");
const config = require('../config');

let port = config.port;
app.set("port", port);

let server = http.createServer(app);
server.listen(port);

server.on("error", (err) => {
  console.error(err);
});

server.on("listening", () => {
  console.log(`Server listening on port ${port}`)
});
```

**#!/usr/bin/env node** in an executable plain-text file on Unix-like platforms, tells the system what interpreter to pass that file to for execution, via the command line following the magic #! prefix (called **shebang**).
Windows does not support **shebang lines**, so this line will be ignored.

Run ```node bin/www``` to start the server on localhost:3000

### 4. Add user model, controller, route and test files. The project structure should be like this:
!['express'](img/nodejs-express-mongodb-mocha-chai.jpg)

**app.js**:

```javascript
const express = require("express");
const mongoose = require("mongoose");
const createError = require("http-errors");
const bodyParser= require('body-parser');
const config = require('./config');
const env = process.env.NODE_ENV || 'development';

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(config.db[env], config.dbParams);

mongoose.connection.on("error", err => {
    console.log("err", err)
});
  
mongoose.connection.on("connected", () => {
  console.log("mongoose is connected...")
});

mongoose.connection.on("disconnected", () => {
  console.log("mongoose is disconnected...")
});

const usersRouter = require("./routes/user.route");

app.use("/api/users", usersRouter);

app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.status(err.status || 500);
  res.send(err);
});

module.exports = app;
```

**config.js**:

```javascript
module.exports = {
    port: 3000,
    db: {
      production: "mongodb://user:pass@example.com:1234/musika",
      development: "mongodb://localhost/musika",
      test: "mongodb://localhost:27017/musika",
    },
    dbParams: {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    }
};
```

**user.model.js**:

```javascript
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
    unique: true
  },
  country: {
    type: String,
    required: true
  }
});

module.exports.User = mongoose.model("User", userSchema);
```

**user.route.js**:

```javascript
const express = require("express");
const router = express.Router();
const controller = require("../controllers/user.controller");

router
  .route("/")
  .get(controller.getAllUsers)
  .post(controller.createUser);
router
  .route("/:id")
  .get(controller.getUser)
  .put(controller.updateUser)
  .delete(controller.deleteUser);

module.exports = router;
```

**user.controller.js**:

```javascript
const mongoose = require("mongoose");
const { User } = require("../models/user.model");

module.exports.getAllUsers = async (req, res) => {
  let users = await User.find({});
  return res.send(users);
};

module.exports.getUser = async (req, res) => {
  let userId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(userId))
    return res.status(400).send("Invalid object id");
  let user = await User.findById(userId);
  if (!user) return res.status(404).send("User not found");
  return res.send(user);
};

module.exports.createUser = async (req, res) => {
  console.log(req.body);
  let user = new User({
    name: req.body.name,
    email: req.body.email,
    country: req.body.country
  });
  await user.save();
  return res.send(user);
};

module.exports.updateUser = async (req, res) => {
  let userId = req.params.id;
  User.findOneAndUpdate(userId, req.body, { new: true })
    .then(user => {
      return res.send(user);
    })
    .catch(err => {
      return res.status(500).send(err);
    });
};

module.exports.deleteUser = async (req, res) => {
  let userId = req.params.id;
  await User.findByIdAndRemove(userId);
  return res.send("User deleted");
};
```

**user.test.js**:

```javascript
const expect = require("chai").expect;
const request = require("supertest");
const { User } = require("../models/user.model");
const app = require("../app");
const mongoose = require('mongoose');
const config = require('../config');
const env = process.env.NODE_ENV || 'development';

let userId = '';

describe("api/users", () => {
  before(async () => {
    // before each test delete all users table data
    await User.deleteMany({});
  });

  after(async () => {
    mongoose.disconnect();
  });

  it("should connect and disconnect to mongodb", async () => {
      // console.log(mongoose.connection.states);
      mongoose.disconnect();
      mongoose.connection.on('disconnected', () => {
        expect(mongoose.connection.readyState).to.equal(0);
      });
      mongoose.connection.on('connected', () => {
        expect(mongoose.connection.readyState).to.equal(1);
      });
      mongoose.connection.on('error', () => {
        expect(mongoose.connection.readyState).to.equal(99);
      });

      await mongoose.connect(config.db[env], config.dbParams);
  });

  describe("GET /", () => {
    it("should return all users", async () => {
      const users = [
        { name: "george", email: "geo@gmail.com", country: "romania" },
        { name: "maria", email: "maria@gmail.com", country: "spain" }
      ];
      await User.insertMany(users);
      console.log(users);
      const res = await request(app).get("/api/users");
      expect(res.status).to.equal(200);
      expect(res.body.length).to.equal(2);
    });
  });

  describe("GET/:id", () => {
    it("should return a user if valid id is passed", async () => {
      const user = new User({
        name: "florian",
        email: "florian@gmail.com",
        country: "germany"
      });
      await user.save();
      const res = await request(app).get("/api/users/" + user._id);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("name", user.name);
    });

    it("should return 400 error when invalid object id is passed", async () => {
      const res = await request(app).get("/api/users/1");
      expect(res.status).to.equal(400);
    });

    it("should return 404 error when valid object id is passed but does not exist", async () => {
      const res = await request(app).get("/api/users/5f43ef20c1d4a133e4628181");
      expect(res.status).to.equal(404);
    });
  });

  describe("POST /", () => {
    it("should return user when the all request body is valid", async () => {
      const res = await request(app)
        .post("/api/users")
        .send({
          name: "esteve",
          email: "esteve@gmail.com",
          country: "spain"
        });
      const data = res.body;
      expect(res.status).to.equal(200);
      expect(data).to.have.property("_id");
      expect(data).to.have.property("name", "esteve");
      expect(data).to.have.property("email", "esteve@gmail.com");
      expect(data).to.have.property("country", "spain");
      expect(data.name).to.have.length.within(3, 50);
      expect(data.email).to.have.length.within(5, 255);

      const user = await User.findOne({ email: 'esteve@gmail.com' });
      expect(user.name).to.equal('esteve');
      expect(user.email).to.equal('esteve@gmail.com');
    });
  });

  describe("PUT /:id", () => {
    it("should update the existing user and return 200", async() => {
        const user = new User({
            name: "lola",
            email: "lola@gmail.com",
            country: "spain"
        });
        await user.save();

        const res = await request(app)
            .put("/api/users/" + user._id)
            .send({
                name: "juan",
                email: "juan@gmail.com",
                country: "spain"
            });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("name", "juan");
      expect(res.body).to.have.property("email", "juan@gmail.com");
      expect(res.body).to.have.property("country", "spain");
    });
  });

  describe("DELETE /:id", () => {
    it("should delete requested id and return response 200", async () => {
      const user = new User({
        name: "george",
        email: "geo@gmail.com",
        country: "spain"
      });
      await user.save();
      userId = user._id;
      const res = await request(app).delete("/api/users/" + userId);
      expect(res.status).to.be.equal(200);
    });

    it("should return 404 when deleted user is requested", async () => {
      let res = await request(app).get("/api/users/" + userId);
      expect(res.status).to.be.equal(404);
    });
  });
});
```

### 5. Execute Test Coverage:

```shell
npm run coverage
```
The console output:

!['tdd-mocha-chai-express'](img/test-tdd-mocha-chai-express-api.jpg)

This will create the coverage folder, open it's index.html:

!['tdd-istanbul-express-test-coverage'](img/tdd-nyc-istanbul-test-coverage.jpg)

Nicely how Istanbul shows exactly which lines of code are not covered by your tests:

!['tdd-istanbul-express-test-coverage-file'](img/tdd-nyc-istanbul-test-coverage-file.jpg)


Read more articles like this on [Girlsincode](https://girlsincode.com/articles/)
