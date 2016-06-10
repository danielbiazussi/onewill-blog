const express = require('express');
const bodyParser = require('body-parser');
const Handlebars = require('handlebars');
const fs = require('fs');

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
  var renderTemplate = (filename) => {
    return fs.readFileSync(__dirname + "/public/templates/" + filename).toString();
  };

  var textParse = "";
  var textParseRelated = "";

  var getFiles = (path, files) => {
    fs.readdirSync(path).forEach((file) => {
      var subpath = path + '/' + file;
      if(fs.lstatSync(subpath).isDirectory()){
        getFiles(subpath, files);
      } else {
        if (file.match(/\.txt$/)) {
          var templateString = fs.readFileSync(path + '/' + file).toString();

          var reg = /\[image\]([\s\S]*)\[\/image\]/gm;
          var image = reg.exec(templateString)[1];

          var reg = /\[title\]([\s\S]*)\[\/title\]/gm;
          var title = reg.exec(templateString)[1];

          var reg = /\[call\]([\s\S]*)\[\/call\]/gm;
          var call = reg.exec(templateString)[1];

          var postItem = renderTemplate("post_item.html");
          textParse += postItem.replace("$1", "post/" + path.split("/")[path.split("/").length-1])
                               .replace("$2", path.split("/")[path.split("/").length-1] + '/' + image)
                               .replace("$3", title)
                               .replace("$4", call);

           var postItemRelated = renderTemplate("post_item_related.html");
           textParseRelated += postItemRelated.replace("$1", "post/" + path.split("/")[path.split("/").length-1])
                                       .replace("$2", path.split("/")[path.split("/").length-1] + '/' + image)
                                       .replace("$3", title);

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
  var renderTemplate = (filename) => {
    return fs.readFileSync(__dirname + "/public/templates/" + filename).toString();
  };

  fs.readFile(__dirname + "/posts/" + req.params.slug + '/text.txt', (err, post) => {
    if (err) {
      res.send('Post não encontrado');
    } else {
      var postString = post.toString();
      fs.readFile(__dirname + "/public/views/post.html", (err, template) => {
        var templateString = template.toString();

        // Title
        var reg = /\[title\]([\s\S]*)\[\/title\]/gm;
        templateString = templateString.replace(/\{\{title\}\}/gm, reg.exec(postString)[1]);

        // Call
        var reg = /\[call\]([\s\S]*)\[\/call\]/gm;
        templateString = templateString.replace(/\{\{call\}\}/gm, reg.exec(postString)[1]);

        // Image
        var reg = /\[image\]([\s\S]*)\[\/image\]/gm;
        templateString = templateString.replace(/\{\{image\}\}/gm, "/" + req.params.slug + "/" + reg.exec(postString)[1]);

        // Tables
        // TODO catch if none
        var reg = /(\[table[^\]]*\](?:[^\[]*)\[\/\s*table\])/g;
        // var tables = postString.match(reg);
        postString = postString.replace(reg, (table) => {
          var textParse = "";
          var tableReg = /\[table\]([\s\S]*)\[\/table\]/gm;
          table = tableReg.exec(table)[1];
          table.split("\n").forEach((row, index) => {
            if (row.length > 0) {
              var tableRow = renderTemplate("text_table_row.html");
              row.split("|").forEach((column, index2) => {
                if (index2 == 0) {
                  tableRow = tableRow.replace(`$${++index2}`, `/images/icon-power-${column}.svg`);
                } else  {
                  if (index2 == 2) {
                    if (column > 0) {
                      tableRow = tableRow.replace(`$${++index2}`, `/images/icon-up-${column}.svg`);
                    } else {
                      tableRow = tableRow.replace(`$${++index2}`, `/images/icon-down-${-column}.svg`);
                    }
                  } else {
                    tableRow = tableRow.replace(`$${++index2}`, column);
                  }
                }
              });
              textParse += tableRow;
            }
          });
          return renderTemplate("text_table.html").replace(/\{\{rows\}\}/gm, textParse);
        });

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
              var header = renderTemplate("text_header.html");
              textParse += header.replace("$1", headers.length)
                                 .replace("$2", paragraph.substr(1));
            } else {
              var text = renderTemplate("text_paragraph.html");
              textParse += text.replace("$1", paragraph);
            }
          }
        }

        // Index
        var template = renderTemplate("text_index.html");
        var templateConcat = "";
        headers.forEach((header, index) => {
          templateConcat += template.repeat(1).replace("$1", "#" + index)
                                              .replace("$2", header)
                                              .replace("$3", ++index);
        });

        templateString = templateString.replace(/\{\{index\}\}/gm, templateConcat);

        // Text Images
        var reg = /\[text-image\]([\s\S]*)\[\/text-image\]/gm;
        var template = renderTemplate("text_image.html");
        textParse = textParse.replace(reg, template.replace("$1", `/${req.params.slug}/${reg.exec(textParse)[1]}`));

        templateString = templateString.replace(/\{\{text\}\}/gm, textParse);
        res.send(Handlebars.compile(templateString)());
      });
    }
  });
});

var server = app.listen(process.env.PORT, () => {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Web server started at http://%s:%s', host, port);
});
