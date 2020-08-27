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