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
var LocalStrategy = require("passport-local");
var multer = require("multer");
var session = require('express-session')
var flash = require('express-flash');
var bcrypt = require('bcrypt');
var csv = require('csv-parser');

//PASSPORT SETUP
const initializePassport = require('./passport-config')
initializePassport(
    passport, 
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
)


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
    secret: "Once again rusty is the cutest dog",
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session());

var testFolder = '/media/pi/ELEMENTS\ B';

app.use(methodOverride("_method"));




app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    next();
});







//USER ARRAY

var users = [];

//LOAD USERS IN FROM CSV FOLDER
fs.createReadStream('myfile.csv')
.pipe(csv())
.on('data', (data) => users.push(data))
.on('end', () => {
    console.log(users);
    
});

function checkAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next()
    }
    res.redirect('/login');
}





var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
   
  var upload = multer({ storage: storage })

app.use(express.static(__dirname + "/public"));
app.use(express.static("/media/pi/ELEMENTS\ B"));

//ROUTES--------------------

//Home page route 
app.get("/", function(req,res){
    
    res.render("landingpage.ejs");
})

app.get("/usersfiles/:user", function(req,res){
    var user = req.params.user;
    
    testFolder = '/media/pi/ELEMENTS\ B/'+ user;
    var files = fs.readdirSync(testFolder)
    var breadcrumb = user
    res.render("home.ejs", {files:files, breadcrumb:breadcrumb} );
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
    file = file.substring(20, file.length)
    console.log(file)
    
    res.download('/media/pi/ELEMENTS\ B'+ file);
    

})



//--------------------------------------------------------------------
//                  ROUTES FOR USERS AND LOGIN 
//--------------------------------------------------------------------

//Register 
app.get("/register", function(req, res){
    res.render("register.ejs");
})

app.post("/register", function(req, res){
    var password = req.body.password;
    var the_hash;
    bcrypt.hash(password, 10, function(err, hash){
        the_hash = hash;
        the_id = Date.now().toString();
        users.push({
            id: the_id,
            name: req.body.name,
            email: req.body.email,
            password: hash
        })
        fs.mkdirSync('/media/pi/ELEMENTS\ B/' +  req.body.name);
        var stream = fs.createWriteStream("myfile.csv", {
            'flags':'a',
            'encoding': null,
            'mode':0666
            });
        stream.once('open', function(fd){
            stream.write(the_id + ",");
            stream.write(req.body.name + ",");
            stream.write(req.body.email + ",");
            stream.write(the_hash + "\n");
            stream.end();
        });
        
        
        passport.authenticate('local')(req,res, function() {
            res.redirect("/usersfiles/" + req.body.name );
        })
        
            
        
        if(err){
            res.redirect('/register');
        }
        console.log(users);
    })
})

//Login 

app.get("/login", function(req, res){
    res.render("login.ejs");
    
})

app.post("/login", passport.authenticate('local'), function(req,res) {
    res.redirect("/usersfiles/" + req.user.name)
})

//Logout

app.delete("/logout", function(req,res){
    req.logOut();
    res.redirect('/login')
})



app.listen("3002");
