var express = require('express');
var packageInfo = require('./package.json');
var bodyParser = require('body-parser');
const fs = require('fs');

var app = express();

app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/posts'));

app.get('/', (req, res) => {
  res.send('1Will Blog');
});

app.get('/post/:slug', (req, res) => {
  var renderTemplate = (filename) => {
    return (__dirname + "/public/templates/" + filename).toString();
  };

  fs.readFile(__dirname + "/posts/" + req.params.slug + '/text.txt', (err, post) => {
    if (err) {
      res.send('Post não encontrado');
    } else {
      var postString = post.toString();
      fs.readFile(__dirname + "/post.html", (err, template) => {
        var templateString = template.toString();

        // Title
        var reg = /\[title\]([\s\S]*)\[\/title\]/gm;
        templateString = templateString.replace(/\{\{title\}\}/gm, reg.exec(postString)[1]);

        // Subtitle
        var reg = /\[subtitle\]([\s\S]*)\[\/subtitle\]/gm;
        templateString = templateString.replace(/\{\{subtitle\}\}/gm, reg.exec(postString)[1]);

        // Call
        var reg = /\[call\]([\s\S]*)\[\/call\]/gm;
        templateString = templateString.replace(/\{\{call\}\}/gm, reg.exec(postString)[1]);

        // Image
        var reg = /\[image\]([\s\S]*)\[\/image\]/gm;
        templateString = templateString.replace(/\{\{image\}\}/gm, "/" + req.params.slug + "/" + reg.exec(postString)[1]);

        // Text
        var reg = /\[text\]([\s\S]*)\[\/text\]/gm;
        var text = reg.exec(postString)[1];
        var temp = "";

        var blocks = text.split(/(?=^#[^\n]*$)/gm); // Positive lookahead to keep delimiter
        blocks.shift();

        var textParse = "";
        var headers = [];
        for (var block of blocks) {
          for (var paragraph of block.split(/\n\n/g)) {
            if (paragraph.charAt(0) == "#") {
              headers.push(paragraph.substr(1));
              var header = fs.readFileSync(renderTemplate("text_header.html")).toString();
              textParse += header.replace("$1", headers.length)
                                 .replace("$2", paragraph.substr(1));
            } else {
              textParse += "<p>" + paragraph + "</p>";
            }
          }
        }

        // Index
        var template = fs.readFileSync(renderTemplate("text_index.html")).toString();
        var templateConcat = "";
        headers.forEach(function(header, index) {
          templateConcat += template.repeat(1).replace("$1", "#" + index)
                                              .replace("$2", header)
                                              .replace("$3", ++index);
        });

        templateString = templateString.replace(/\{\{index\}\}/gm, templateConcat);

        // Text Images
        var reg = /\[text-image\]([\s\S]*)\[\/text-image\]/gm;
        textParse = textParse.replace(reg, "<img src='" + "/" + req.params.slug + "/" + reg.exec(textParse)[1] + "'/>");

        templateString = templateString.replace(/\{\{text\}\}/gm, textParse);

        res.send(templateString);
      });
    }
  });
});

var server = app.listen(process.env.PORT, () => {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Web server started at http://%s:%s', host, port);
});
