const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const Handlebars = require('handlebars');
const Parser = require('./parser');

var app = express();

app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/posts'));

// Register templates
var partialsDir = __dirname + '/public/partials';
var filenames = fs.readdirSync(partialsDir);

filenames.forEach(function (filename) {
  var matches = /^([^.]+).hbs$/.exec(filename);
  if (!matches) {
    return;
  }
  var name = matches[1];
  var template = fs.readFileSync(partialsDir + '/' + filename, 'utf8');
  Handlebars.registerPartial(name, template);
});

// Routes
app.get('/', (req, res) => {
  var textParse = "";
  var textParseRelated = "";

  var getFiles = (path, files) => {
    fs.readdirSync(path).forEach((file) => {
      var subpath = path + '/' + file;
      if (fs.lstatSync(subpath).isDirectory()) {
        if (subpath.split("/").pop() == ".cache") {
          textParse += fs.readFileSync(subpath + "/post_item_cache.html").toString();
          textParseRelated += fs.readFileSync(subpath + "/post_item_related_cache.html").toString();
        } else {
          getFiles(subpath, files);
        }
      }
    });
  }

  getFiles(__dirname + "/posts", []);

  var templateString = fs.readFileSync(__dirname + "/public/views/home.html").toString();
  templateString = templateString.replace(/\{\{posts\}\}/gm, textParse);
  templateString = templateString.replace(/\{\{relateds\}\}/gm, textParseRelated);

  res.send(Handlebars.compile(templateString)());
});

app.get('/post/:slug', (req, res) => {
  var postPath = __dirname + "/posts/" + req.params.slug + '/text.txt';
  var postCachePath = __dirname + "/posts/" + req.params.slug + '/cache/post_cache.html';

  fs.readFile(postPath, (err, post) => {
    if (err) {
      res.send('Post não encontrado');
    } else {
      fs.readFile(postCachePath, (err, postCached) => {
        if (err) {
          res.send(Parser.parsePost(post, req.params.slug));
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

  console.log('Web server started at http://%s:%s', host, port);
});
