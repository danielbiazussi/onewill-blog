const showdown = require('showdown');
const markdown = new showdown.Converter();

const postsPath = __dirname + "/posts";
const viewsPath = __dirname + "/public/views";
const templatesPath = __dirname + "/public/templates";

const imageRemote = "https://process.filestackapi.com/AV0jeucXSwuibGqPRbugyz";

var renderTemplate = (filename) => {
  return fs.readFileSync(`${templatesPath}/${filename}`).toString();
};

var parseStudies = (slug, rowName) => {
  var studiesPath = __dirname + "/posts/" + slug + '/studies.txt';
  var studiesString = fs.readFileSync(studiesPath).toString();

  var studies = "";
  var count = 0;

  // Text
  var blocks = studiesString.split(/(?=^#[^\n]*$)/gm); // Positive lookahead to keep delimiter

  blocks.forEach((block, index) => {
    if (block.match(/#(.*)/)[1] == rowName) {
      block.split("---").forEach((subblock) => {
        var templateString = fs.readFileSync(`${__dirname}/public/partials/study.hbs`).toString();

        // Title
        var reg = /\[title\]([^\[]*)\[\/title\]/gm;
        var title = reg.exec(subblock)[1];

        // Properties [Increase, Cohort, n/a, 37, n/a]
        var reg = /\[properties\]([^\[]*)\[\/properties\]/gm;
        var properties = reg.exec(subblock)[1];
        properties = properties.split(",");

        // Title
        var reg = /\[link\]([^\[]*)\[\/link\]/gm;
        var link = reg.exec(subblock)[1];

        // Notes
        var reg = /\[notes\]([^\[]*)\[\/notes\]/gm;
        var notes = reg.exec(subblock)[1];

        params = {
          study: {
            title: title,
            link: link,
            properties: properties,
            notes: notes
          }
        }

        studies += Handlebars.compile(templateString)(params);
        count++;
      });

      var templateString = renderTemplate("post_studies.hbs");
      templateString = templateString.replace("$1", ++index);
      studies = templateString.replace(/\{\{studies\}\}/gm, studies);
    }
  });

  return {count: count, text: studies};
}

var parsePost = (post, slug) => {
  var postString = post.toString();
  var templateString = fs.readFileSync(`${viewsPath}/post.html`).toString();

  // Zombie
  var reg = /\[zombie\]([\s\S]*)\[\/zombie\]/gm;
  var zombie = reg.exec(postString);

  // Url
  templateString = templateString.replace(/\{\{url\}\}/gm, `post/${slug}`);

  // Title
  var reg = /\[title\]([\s\S]*)\[\/title\]/gm;
  var title = reg.exec(postString)[1];
  templateString = templateString.replace(/\{\{title\}\}/gm, title);

  // Votes
  var reg = /\[votes\]([\s\S]*)\[\/votes\]/gm;
  var votes = reg.exec(postString)[1];

  // Date
  var reg = /\[date\]([\s\S]*)\[\/date\]/gm;
  var date = reg.exec(postString)[1];

  // Call
  var reg = /\[call\]([\s\S]*)\[\/call\]/gm;
  var call = reg.exec(postString)[1];
  templateString = templateString.replace(/\{\{call\}\}/gm, call);

  // Cover
  var reg = /\[cover\]([\s\S]*)\[\/cover\]/gm;
  var cover = reg.exec(postString)[1];
  templateString = templateString.replace(/\{\{metaImage\}\}/gm, imageSmall(cover, slug));
  templateString = templateString.replace(/\{\{cover\}\}/gm, imageLarge(cover, slug));

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
  var studies = "";
  var reg = /(<table[^>]*>(?:[^<]*)<\/table>)/g;
  textParse = textParse.replace(reg, (table) => {
    var rowConcat = "";
    var count = 1;
    var tableReg = /<table>([\s\S]*)<\/table>/gm;
    table = tableReg.exec(table)[1];
    table.split("\n").forEach((row, index) => {
      if (row.length > 0) {
        var tableRow = renderTemplate("text_table_row.html");
        var countStudies = 0;
        row.split("|").forEach((column, index2) => {
          if (index2 == 0) {
            tableRow = tableRow.replace(`$${++index2}`, `/images/icon-power-${column}.svg`);
          } else  {
            if (index2 == 1) {
              // Parse studies
              var studiesHash = parseStudies(slug, column);
              countStudies = studiesHash["count"];
              studies += studiesHash["text"];

              tableRow = tableRow.replace(`$${++index2}`, column);
            } else {
              if (index2 == 2) {
                if (column > 0) {
                  tableRow = tableRow.replace(`$${++index2}`, `/images/icon-up-${column}.svg`);
                } else {
                  tableRow = tableRow.replace(`$${++index2}`, `/images/icon-down-${-column}.svg`);
                }
              } else {
                if (index2 == 3) {
                  var template = renderTemplate("post_study_see_all.html");
                  template = template.replace("$1", column)
                                     .replace("$2", (countStudies == 0 ? "hidden" : ""))
                                     .replace("$3", (countStudies > 0 ? count++ : 0))
                                     .replace("$4", countStudies);

                  tableRow = tableRow.replace(`$${++index2}`, template);
                } else {
                  tableRow = tableRow.replace(`$${++index2}`, markdown.makeHtml(column));
                }
              }
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
    return renderTemplate("text_image.html").replace("$1", imageMedium(image, slug));
  });

  // Append text
  templateString = templateString.replace(/\{\{text\}\}/gm, textParse);

  // Append studies
  templateString = templateString.replace(/\{\{studies\}\}/gm, studies);

  templateString = Handlebars.compile(templateString)();

  // Do savings in background...
  if (!directoryExistsSync(`${postsPath}/${slug}/.cache`)) {
    fs.mkdirSync(`${postsPath}/${slug}/.cache`);
  }

  fs.writeFile(`${postsPath}/${slug}/.cache/post_cache.html`, templateString);

  var postItem = Handlebars.compile(renderTemplate("post_item.hbs"))();
  postItem = postItem.replace("$1", votes)
                     .replace("$2", `post/${slug}`)
                     .replace("$3", imageSmall(cover, slug))
                     .replace("$4", title)
                     .replace("$5", call);

  fs.writeFile(`${postsPath}/${slug}/.cache/post_item_cache.html`, postItem);

  var postItemRelated = renderTemplate("post_item_related.html");
  postItemRelated = postItemRelated.replace("$1", `post/${slug}`)
                                   .replace("$2", imageSmall(cover, slug))
                                   .replace("$3", title);

  fs.writeFile(`${postsPath}/${slug}/.cache/post_item_related_cache.html`, postItemRelated);

  if (zombie) {
    return { post: renderTemplate("post_zombie.html"), postItem: postItem, postItemRelated: postItemRelated };
  } else {
    return { post: templateString, postItem: postItem, postItemRelated: postItemRelated };
  }
}

var imageLarge = (image, slug) => {
  if (env == "production") {
    return `${imageRemote}/resize=width:2000,fit:max/output=compress:true,quality:95/cache=expiry:86400/${imageSrc(image, slug)}`
  } else {
    return imageSrc(image, slug);
  }
}

var imageMedium = (image, slug) => {
  if (env == "production") {
    return `${imageRemote}/resize=width:1200,fit:max/output=compress:true,quality:95/cache=expiry:86400/${imageSrc(image, slug)}`
  } else {
    return imageSrc(image, slug);
  }
}

var imageSmall = (image, slug) => {
  if (env == "production") {
    return `${imageRemote}/resize=width:800/sharpen=amount:1/cache=expiry:86400/${imageSrc(image, slug)}`
  } else {
    return imageSrc(image, slug);
  }
}

var imageSrc = (image, slug) => {
  if (/^https?:\/\/.*/.test(image)) {
    return `${image}`;
  } else {
    return `${domain}/${slug}/images/${image}`;
  }
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
