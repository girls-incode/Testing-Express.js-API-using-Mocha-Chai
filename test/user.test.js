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