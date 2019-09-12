//------------------------------------------------------
//                 STORAGE SITE SERVER SIDE
//------------------------------------------------------
// Matt Haywood

var path = require("path")
var express = require("express");
var app = express();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var fs = require("fs-extra");
var methodOverride = require("method-override");
var passport = require("passport");
var passportLocalMongoose = require("passport-local-mongoose");
var LocalStrategy = require("passport-local");
var multer = require("multer")

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
   
  var upload = multer({ storage: storage })


app.use(bodyParser.urlencoded({ extended: false }))
const testFolder = './public';

app.use(methodOverride("_method"));
app.use(bodyParser.json())

var UserSchema = new mongoose.Schema({
    username: String,
    email: String
})

UserSchema.plugin(passportLocalMongoose);
var User = mongoose.model("User", UserSchema);

app.use(require("express-session")({
    secret: "This is the secret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function (req,res,next) {
    res.locals.currentUser = req.user;
    next();
})

app.use(express.static(__dirname + "/public"));

//ROUTES--------------------

//Home page route 
app.get("/", function(req,res){
    var files = fs.readdirSync(testFolder)
    res.render("home.ejs", {files:files});
})

//Post route for searching a directory 
app.post("/searchdir", function(req,res){
    var dir = req.body.dir;
    console.log("DIR SEARCHED: " + dir);
    var files = fs.readdirSync(dir) //Files returns an array of filenames
    var objfiles = []
    files.forEach(function(filename){
        var the_file = new Object();
        the_file.filename = filename;
        the_file.stats = fs.statSync(dir + "/" + filename)
        if(the_file.stats.isFile()){
            the_file.filetype = "File"; 
        }
        else {
            the_file.filetype = "Directory";
        }
        objfiles.push(the_file);
    })
    console.log(dir, files);
    res.send(objfiles)
})

//Route for creating a new directory
app.post("/newfolder", function(req,res){
    var nameoffile = req.body.name;
    var path = req.body.path;
    console.log("NEW FILE CREATED: " + path + req.body.name);
    fs.mkdirSync(path + "/" + nameoffile);
    res.redirect("/");
})

//Route for deleting a directory
app.post("/deletedir", function(req, res){
    var path = req.body.dir;
    var name = req.body.name
    console.log("FILE DELETED: " + path + "/" + req.body.name)
    fs.removeSync(path + "/" + name)
})

//Route for File Upload
app.post("/uploadfile",upload.array('fileElem', 5), function(req,res){
    //var path = req;
    var name = req.fileElem;
    
    //console.log(path)
    
    console.log("UPLOADED FILE: " + req.body.filename)
    console.log("thepath   " + req.body.thepath)
    fs.moveSync("./public/" + req.body.filename, req.body.thepath + "/" + req.body.filename)
    console.log("done")
    res.send("DONE");

})

//Route for File Download 

app.get("/downloadfile", function(req,res){
    var file = req.query.file;
    console.log("SENDING FILE: " + file)
    file = file.substring(1, file.length)
    console.log(file)
    console.log(__dirname);
    res.download(path.join(__dirname, file))
    

})


app.listen("3000");