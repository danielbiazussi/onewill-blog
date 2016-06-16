env = process.env.NODE_ENV || "development";

express = require('express');
bodyParser = require('body-parser');
fs = require('fs');
Handlebars = require('handlebars');
Parser = require('./parser');
require('./handlebars');

var app = express();

app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/posts'));

// Routes
app.get('/:sort?', (req, res) => {
  var sort = req.params.sort || "best";
  var textParse = "";
  var textParseRelated = "";

  var postsSort = [];
  var postsRelatedSort = [];

  var getFiles = (path, files) => {
    fs.readdirSync(path).forEach((file) => {
      var subpath = path + '/' + file;
      if (fs.lstatSync(subpath).isDirectory()) {
        getFiles(subpath, files);
      } else {
        if (file == "text.txt") {
          var subpath2 = subpath.split("/");
          subpath2.pop();
          var slug = subpath2.pop();

          var postTemplate = fs.readFileSync(subpath).toString();
          var postParsed = Parser.parsePost(postTemplate, slug);

          // Date
          var reg = /\[date\]([\s\S]*)\[\/date\]/gm;
          var date = reg.exec(postTemplate)[1];

          // Votes
          var reg = /\[votes\]([\s\S]*)\[\/votes\]/gm;
          var votes = reg.exec(postTemplate)[1];

          postsSort.push({
            date: date,
            votes: votes,
            text: postParsed["postItem"]
          });

          postsRelatedSort.push({
            votes: votes,
            text: postParsed["postItemRelated"]
          });
        }
      }
    });
  }

  getFiles(__dirname + "/posts", []);

  postsSort.sort(function(postA, postB){
    if (sort == "best") {
      return postB.votes - postA.votes;
    } else {
      return new Date(postB.date) - new Date(postA.date);
    }
  }).forEach((post) => {
    textParse += post.text;
  });

  postsRelatedSort.sort(function(postA, postB){
    return postB.votes - postA.votes;
  }).forEach((post) => {
    textParseRelated += post.text;
  });

  var templateString = fs.readFileSync(__dirname + "/public/views/home.html").toString();
  templateString = templateString.replace(/\{\{posts\}\}/gm, textParse);
  templateString = templateString.replace(/\{\{relateds\}\}/gm, textParseRelated);

  var tabs = fs.readFileSync(__dirname + "/public/templates/tabs.html").toString();
  tabs = tabs.replace("$1", (sort == "best" ? "" : "hidden"))
             .replace("$2", (sort == "best" ? "hidden" : ""))

  templateString = templateString.replace(/\{\{tabs\}\}/gm, tabs);

  res.send(Handlebars.compile(templateString)());
});

app.get('/post/:slug', (req, res) => {
  var postPath = __dirname + "/posts/" + req.params.slug + '/text.txt';
  var postCachePath = __dirname + "/posts/" + req.params.slug + '/cache/post_cache.html';

  fs.readFile(postPath, (err, post) => {
    if (err) {
      res.send('Sorry, post not found.');
    } else {
      fs.readFile(postCachePath, (err, postCached) => {
        if (err) {
          res.send(Parser.parsePost(post, req.params.slug)["post"]);
        } else {
          res.send(postCached.toString());
          Parser.parsePost(post, req.params.slug);
        }
      });
    }
  });
});

var server = app.listen(process.env.PORT, () => {
  var host = server.address().address;
  var port = server.address().port;

  if (env == "production") {
    domain = "blog.1will.com.br";
  } else {
    domain = `localhost:${port}`;
  }

  console.log('Web server started at http://%s:%s', host, port);
});
