const fs = require('fs');
const Handlebars = require('handlebars');
const showdown = require('showdown');
const markdown = new showdown.Converter();

const postsPath = __dirname + "/posts";
const viewsPath = __dirname + "/public/views";
const templatesPath = __dirname + "/public/templates";

var renderTemplate = (filename) => {
  return fs.readFileSync(`${templatesPath}/${filename}`).toString();
};

var parsePost = (post, slug) => {
  var postString = post.toString();
  var template = fs.readFileSync(`${viewsPath}/post.html`);
  var templateString = template.toString();

  // Title
  var reg = /\[title\]([\s\S]*)\[\/title\]/gm;
  var title = reg.exec(postString)[1];
  templateString = templateString.replace(/\{\{title\}\}/gm, title);

  // Call
  var reg = /\[call\]([\s\S]*)\[\/call\]/gm;
  var call = reg.exec(postString)[1];
  templateString = templateString.replace(/\{\{call\}\}/gm, call);

  // Cover
  var reg = /\[cover\]([\s\S]*)\[\/cover\]/gm;
  var cover = reg.exec(postString)[1]
  if (/^https?:\/\/.*/.test(cover)) {
    templateString = templateString.replace(/\{\{cover\}\}/gm, cover);
  } else {
    templateString = templateString.replace(/\{\{cover\}\}/gm, `/${slug}/${reg.exec(postString)[1]}`);
  }

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
      var paragraphTrimmed = paragraph.trim();
      if (paragraphTrimmed.length > 0) {
        if (paragraph.charAt(0) == "#") {
          headers.push(paragraph.substr(1));
          var header = renderTemplate("text_header.html");
          textParse += header.replace("$1", headers.length)
                             .replace("$2", paragraph.substr(1));
        } else {
          // Avoid wrapping custom elements with <p>
          if (paragraphTrimmed.indexOf("<^") == 0) {
            textParse += paragraph;
          } else {
            var text = renderTemplate("text_paragraph.html");
            textParse += text.replace("$1", markdown.makeHtml(paragraph));
          }
        }
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

  // Tables
  var reg = /(<table[^>]*>(?:[^<]*)<\/table>)/g;
  textParse = textParse.replace(reg, (table) => {
    var rowConcat = "";
    var tableReg = /<table>([\s\S]*)<\/table>/gm;
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
              tableRow = tableRow.replace(`$${++index2}`, markdown.makeHtml(column));
            }
          }
        });
        rowConcat += tableRow;
      }
    });
    return renderTemplate("text_table.html").replace(/\{\{rows\}\}/gm, rowConcat);
  });

  // Text Images
  var reg = /(<image[^>]*>(?:[^<]*)<\/image>)/g;
  textParse = textParse.replace(reg, (image) => {
    var imageReg = /<image>([\s\S]*)<\/image>/gm;
    image = imageReg.exec(image)[1];
    if (/^https?:\/\/.*/.test(image)) {
      return renderTemplate("text_image.html").replace("$1", image);
    } else {
      return renderTemplate("text_image.html").replace("$1", `/${slug}/${image}`);
    }
  });

  // Append text
  templateString = templateString.replace(/\{\{text\}\}/gm, textParse);
  templateString = Handlebars.compile(templateString)();

  // Do savings in background...
  if (!directoryExistsSync(`${postsPath}/${slug}/cache`)) {
    fs.mkdirSync(`${postsPath}/${slug}/cache`);
  }

  fs.writeFile(`${postsPath}/${slug}/cache/post_cache.html`, templateString);

  var postItem = renderTemplate("post_item.html");
  postItem = postItem.replace("$1", `post/${slug}`)
                     .replace("$2", cover)
                     .replace("$3", title)
                     .replace("$4", call);

  fs.writeFile(`${postsPath}/${slug}/cache/post_item_cache.html`, postItem);

   var postItemRelated = renderTemplate("post_item_related.html");
   postItemRelated = postItemRelated.replace("$1", `post/${slug}`)
                               .replace("$2", cover)
                               .replace("$3", title);

  fs.writeFile(`${postsPath}/${slug}/cache/post_item_related_cache.html`, postItemRelated);

  return templateString;
}

var directoryExistsSync = (path) => {
  try {
    return fs.statSync(path).isDirectory();
  } catch (err) {
    return false;
  }
}

module.exports = {
  renderTemplate: renderTemplate,
  parsePost: parsePost
}
