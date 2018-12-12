var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
const Schema = mongoose.Schema;

var axios = require("axios");
var cheerio = require("cheerio");

var db = require("./models");

var PORT = 3000;
var app = express();
app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

mongoose.connect("mongodb://localhost/scrapper", { useNewUrlParser: true });


mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', function () {
  console.log("we're connected!")
});

app.get("/scrape", function (req, res) {
  axios.get("https://www.nytimes.com/").then(function (response) {
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("article").each(function (i, element) {

      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this).text()
      if ($(this).children("div").children("div").children("a").attr("href")) {
        result.link = "https://www.nytimes.com/" + $(this).children("div").children("div").children("a").attr("href");
      }
      if ($(this).children("div").children("div").children("a").children("div").children("p").text()) {
        result.body = $(this).children("div").children("div").children("a").children("div").children("p").text()
      }
      db.Article.create(result)
        .then(function (dbArticle) {
          console.log(dbArticle);
        })
        .catch(function (err) {
          console.log(err);
        });
    });
  });
});

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function (dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});
