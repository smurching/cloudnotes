/**
 * Module dependencies.
 */

var express = require('express');
var MongoStore = require('connect-mongo')(express);
var flash = require('express-flash');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var expressValidator = require('express-validator');
var SummaryTool = require('node-summary');
var AWS = require('aws-sdk')
var nodecr = require('nodecr')
var s3 = new AWS.S3({accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, region: 'us-west-2'}); 


/**
 * Load controllers.
 */

var homeController = require('./controllers/home');
var userController = require('./controllers/user');
var apiController = require('./controllers/api');
var contactController = require('./controllers/contact');

/**
 * API keys + Passport configuration.
 */

var secrets = require('./config/secrets');
var passportConf = require('./config/passport');

/**
 * Create Express server.
 */

var app = express();

/**
 * Mongoose configuration.
 */

mongoose.connect(secrets.db);
mongoose.connection.on('error', function() {
  console.error('✗ MongoDB Connection Error. Please make sure MongoDB is running.');
});

/**
 * Express configuration.
 */

var hour = 3600000;
var day = (hour * 24);
var week = (day * 7);
var month = (day * 30);

app.engine('jade', require('jade').renderFile);
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(require('connect-assets')({
  src: 'public',
  helperContext: app.locals
}));
app.use(express.compress());
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.json());
app.use(express.urlencoded());
app.use(expressValidator());
app.use(express.methodOverride());
app.use(express.session({
  secret: secrets.sessionSecret
  
}));
app.use(express.csrf());
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next) {
  res.locals.user = req.user;
  res.locals.token = req.csrfToken();
  res.locals.secrets = secrets;
  next();
});
app.use(flash());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public'), { maxAge: week }));
app.use(function(req, res) {
  res.status(404);
  res.render('404');
});
app.use(express.errorHandler());

var summarize = function(title, content, callback){
  SummaryTool.summarize(title, content, function(err, summary) {
    if(err) console.log("Something went wrong man!");

    console.log(summary);

    console.log("Original Length " + (title.length + content.length));
    console.log("Summary Length " + summary.length);
    console.log("Summary Ratio: " + (100 - (100 * (summary.length / (title.length + content.length)))));
    callback(summary);
  });
}
/**
 * Application routes.
 */
app.get('/', function(req, res){
  res.render("home");
});

app.get("/test", function(req, res){
  var title = "Swayy is a beautiful new dashboard for discovering and curating online content [Invites]";
  var content = "";
  content += "Lior Degani, the Co-Founder and head of Marketing of Swayy, pinged me last week when I was in California to tell me about his startup and give me beta access. I heard his pitch and was skeptical. I was also tired, cranky and missing my kids – so my frame of mind wasn't the most positive.\n";
  content += "I went into Swayy to check it out, and when it asked for access to my Twitter and permission to tweet from my account, all I could think was, \"If this thing spams my Twitter account I am going to bitch-slap him all over the Internet.\" Fortunately that thought stayed in my head, and not out of my mouth.\n";
  content += "One week later, I'm totally addicted to Swayy and glad I said nothing about the spam (it doesn't send out spam tweets but I liked the line too much to not use it for this article). I pinged Lior on Facebook with a request for a beta access code for TNW readers. I also asked how soon can I write about it. It's that good. Seriously. I use every content curation service online. It really is That Good.\n";
  content += "What is Swayy? It's like Percolate and LinkedIn recommended articles, mixed with trending keywords for the topics you find interesting, combined with an analytics dashboard that shows the trends of what you do and how people react to it. I like it for the simplicity and accuracy of the content curation.\n"; 
  content += "Everything I'm actually interested in reading is in one place – I don't have to skip from another major tech blog over to Harvard Business Review then hop over to another major tech or business blog. It's all in there. And it has saved me So Much Time\n\n";
  content += "After I decided that I trusted the service, I added my Facebook and LinkedIn accounts. The content just got That Much Better. I can share from the service itself, but I generally prefer reading the actual post first – so I end up sharing it from the main link, using Swayy more as a service for discovery.\n";
  content += "I'm also finding myself checking out trending keywords more often (more often than never, which is how often I do it on Twitter.com).\n\n\n";
  content += "The analytics side isn't as interesting for me right now, but that could be due to the fact that I've barely been online since I came back from the US last weekend. The graphs also haven't given me any particularly special insights as I can't see which post got the actual feedback on the graph side (however there are numbers on the Timeline side.) This is a Beta though, and new features are being added and improved daily. I'm sure this is on the list. As they say, if you aren't launching with something you're embarrassed by, you've waited too long to launch.\n";
  content += "It was the suggested content that impressed me the most. The articles really are spot on – which is why I pinged Lior again to ask a few questions:\n";
  content += "How do you choose the articles listed on the site? Is there an algorithm involved? And is there any IP?\n";
  content += "Yes, we're in the process of filing a patent for it. But basically the system works with a Natural Language Processing Engine. Actually, there are several parts for the content matching, but besides analyzing what topics the articles are talking about, we have machine learning algorithms that match you to the relevant suggested stuff. For example, if you shared an article about Zuck that got a good reaction from your followers, we might offer you another one about Kevin Systrom (just a simple example).\n";
  content += "Who came up with the idea for Swayy, and why? And what's your business model?\n";
  content += "Our business model is a subscription model for extra social accounts (extra Facebook / Twitter, etc) and team collaboration.\n";
  content += "The idea was born from our day-to-day need to be active on social media, look for the best content to share with our followers, grow them, and measure what content works best.\n";
  content += "Who is on the team?\n";
  content += "Ohad Frankfurt is the CEO, Shlomi Babluki is the CTO and Oz Katz does Product and Engineering, and I [Lior Degani] do Marketing. The four of us are the founders. Oz and I were in 8200 [an elite Israeli army unit] together. Emily Engelson does Community Management and Graphic Design.\n";
  content += "If you use Percolate or read LinkedIn's recommended posts I think you'll love Swayy.\n";
  content += "Want to try Swayy out without having to wait? Go to this secret URL and enter the promotion code thenextweb . The first 300 people to use the code will get access.\n";
  content += "Image credit: Thinkstock";
  summarize(title, content, function(summary){
    res.render("test", {
      summary : summary
    } 
      );
  });

});

/*
/*


/*
Function to process files. Gets file object from AWS, runs OCR on it,
resaves as processed file
*/
var process_file = function(file){


}

/*
Gets a file and returns a URL pointing to the file to the requester
*/
app.get('/file', function(req, res){
  var filename = req.query.filename;
  console.log(filename);
  var params = {Bucket : 'cloudnotes2014', Key: filename};
  var signed_url = s3.getSignedUrl('getObject', params);
  res.json({url : signed_url});
});

app.post('/file', function(req, res){
  var file_data = req.query.data;
  var filename = req.query.filename;
  console.log("file_data: "+file_data+" filename: "+filename);
  var params = {Bucket: 'cloudnotes2014', Key: filename, Body: file_data};
  s3.putObject(params, function(err, data){
    console.log(err);

  });
});

app.get('/file_post', function(req, res){
  var file_data = req.body.picture_data;
  var filename = "test android post";
  console.log("file_data: "+file_data+" filename: "+filename);
  var params = {Bucket: 'cloudnotes2014', Key: filename, Body: file_data};
  s3.putObject(params, function(err, data){
    console.log(err);

  });
});

/**
 * OAuth routes for sign-in.
 */

/**
 * Start Express server.
 */

app.listen(app.get('port'), function() {
  console.log("✔ Express server listening on port %d in %s mode", app.get('port'), app.settings.env);
});
