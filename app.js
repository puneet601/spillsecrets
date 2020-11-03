//jshint esversion:6
require('dotenv').config();
const express=require("express");
const mongoose=require("mongoose");
const session = require('cookie-session');
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const findOrCreate=require("mongoose-findorcreate");
const app=express(); 
const bodyParser=require("body-parser");
const ejs=require("ejs");

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
     secret:"I like Tuesdays and soop.",
     resave:false,
     saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect("mongodb+srv://admin-Puneet:Springday1!@cluster0.ergrz.mongodb.net/secrets",{useNewUrlParser:true,useUnifiedTopology: true });
mongoose.set("useCreateIndex",true);

const userSchema=new mongoose.Schema({
     name: String,
     email:String,
     password:String,
     googleId:String,
     secret:String
});

userSchema.plugin(passportLocalMongoose); //before creating model after schema
userSchema.plugin(findOrCreate);
const User=new mongoose.model("User",userSchema);
passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
     done(null, user.id);
   });
   
   passport.deserializeUser(function(id, done) {
     User.findById(id, function(err, user) {
       done(err, user);
     });
   });
passport.use(new GoogleStrategy({
     clientSecret: process.env.CLIENT_SECRET,
     clientId: process.env.CLIENT_ID,
     callbackURL: "https://limitless-springs-77151.herokuapp.com/auth/google/secrets",
     useProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
     
   },
  
 function(accessToken, refreshToken, profile, cb) {

     User.findOrCreate({ googleId: profile.id }, function(err, user) {
       cb(err, user);
     });
   }
 ));
app.get("/",function(req,res){
     res.render("home");
});
app.get("/auth/google",
passport.authenticate("google", { scope:[ "profile"] }));
app.get("/auth/google/secrets",
passport.authenticate( 'google', { 
     
     failureRedirect: '/login'
}),
function(req,res){
     res.redirect("/secrets");
});
app.get("/login",function(req,res){
     res.render("login");
});
app.get("/register",function(req,res){
    res.render("register");
});
app.get("/secrets",function(req,res){
User.find({"secret":{$ne: null}},function(err,foundUser){
if(!err){
     if(foundUser){
          res.render("secrets",{usersWithSecrets:foundUser});
     }
}
});
});
app.post("/register",function(req,res){
User.register({username: req.body.username}, req.body.password, function(err,user){
if(err){console.log(err);
res.redirect("/register");}
else{
     passport.authenticate("local")(req,res,function(){
res.redirect("/secrets");
     });
}
});
});
app.get("/submit",function(req,res){
     if(req.isAuthenticated()){
          res.render("submit");
     }
     else
     res.redirect("/login");
});
app.post("/login",function(req,res){
    const user=new User({
         username:req.body.username,
         password:req.body.password
    });
    req.login(user,function(err){
if(err) {console.log(err); res.redirect("/login");}
else{
     passport.authenticate("local")(req,res,function(){
          res.redirect("/secrets");
});
}
    });
});
app.post("/submit",function(req,res){
const submittedSecret=req.body.secret;
User.findById(req.user.id,function(err,foundUser){
if(!err){
     foundUser.secret=submittedSecret;
     foundUser.save(function(){
          res.redirect("/secrets");
     });
}
});
});
app.get("/logout",function(req,res){
req.logout();
res.redirect("/");
});
let port = process.env.PORT;

app.listen(port);