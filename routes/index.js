var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = require('../models/admins');

var session = require('express-session')
var nodemailer = require('nodemailer');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');
var async = require('async');
var crypto = require('crypto');
var flash = require('express-flash');
var json2xls = require('json2xls');
var fs=require('fs');

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://msrmhauth:enigma2k17@msrmh-shard-00-00-znqup.mongodb.net:27017,msrmh-shard-00-01-znqup.mongodb.net:27017,msrmh-shard-00-02-znqup.mongodb.net:27017/msrmh?ssl=true&replicaSet=msrmh-shard-0&authSource=admin";
//var User = require('../app.js');
//var User = mongoose.model('User', userSchema);

router.get('/charts',function(req, res){
    if(req.user) {
        MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            db.collection("empexit").find({}).toArray(function (err, result) {
                if (err) throw err;
                console.log(result);
                res.render('charts', {
                    title: 'Employee Exit Form',
                    user: req.user,
                    res: JSON.stringify(result),
                    number: result.length
                });
                db.close();
            });
        });
    }
    else{
        res.redirect('/login');
    }
});

router.get('/',function(req,res){
    res.render('index', {
        title: 'Employee Exit Form',
        user: req.user
    });
});

router.get('/empexit', function(req, res){
  //if(req.user)
  //{
    console.log("HMMMMMM");
    console.log(req.flash());
    if(req.user)
    {
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            db.collection("empexit").find({}).toArray(function(err, result) {
                if (err) throw err;
                console.log(result);
                res.render('empexit', {
                    title: 'Employee Exit Form',
                    user: req.user,
                    res: JSON.stringify(result),
                    number: result.length
                });
                db.close();
            });
        });
    }
        else
        {
            res.redirect('/login');
      }
//}
    /*else
    {
        res.render('index', {
    title: 'Employee Exit Form',
    user: req.user
  });
    }*/
});

router.post('/cancel',function(req, res) {
    res.send({redirect:'/empexit'});
});

router.post('/del', function(req, res) {
    //console.log(req.flash('success'));
    var list=Object.keys(req.body);
    var isAjaxRequest = req.xhr;
    if(list.length==1&&isAjaxRequest)
    {
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var myquery = { empid: list[0] };
            db.collection("empexit").deleteOne(myquery, function(err, obj) {
                if (err) throw err;
                console.log("1 document deleted");
                res.send({redirect: '/empexit',messages:'Record (Employee ID: '+list[0]+') has been successfully deleted'});
                db.close();
            });
        });
    }
    else{
        res.redirect('/empexit');
    }
});

router.get('/login', function(req, res) {
    if(req.user){
        res.redirect('/');
    }
    else {
        res.render('login', {
            user: req.user
        });
    }
});

router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) return next(err)
    if (!user) {
      return res.redirect('/login')
    }
    req.logIn(user, function(err) {
      if (err) return next(err);
      return res.redirect('/');
    });
  })(req, res, next);
});

router.get('/signup', function(req, res) {
  res.render('signup', {
    user: req.user
  });
});

router.post('/signup', function(req, res) {
  User.findOne({ username: req.body.username }, function(err, user1) {
    User.findOne({ email: req.body.email }, function(err, user) {
        var flag=true;
        if(user1)
        {
          req.flash('error4', 'An account with that USERNAME already exists.');
          flag=false;
        }
        if (user) {
          req.flash('error', 'An account with that EMAIL ADDRESS already exists.');
          flag=false;
        }
        if(req.body.password!=req.body.confirm)
        {
          req.flash('error1','PASSWORD and CONFIRM PASSWORD do not match');
          flag=false;
        }

        if(req.body.password == '' || req.body.confirm == '' || req.body.email == '' || req.body.username == '')
        {
          req.flash('error2','All fields are compulsory');
          flag=false;
        }
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if(!re.test(req.body.email))
        {
            req.flash('error3','Please enter Valid EMAIL');
            flag=false;
        }

        if(!flag)
        {
          res.render('signup', {
            user: req.user,
              username:req.body.username
          });
        }
      else{
      var user = new User({
          username: req.body.username,
          email: req.body.email,
          password: req.body.password
        });

      user.save(function(err) {
                req.logIn(user, function(err) {
                    res.redirect('/');
                });
            });
    }
  });
  });
});

router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

router.get('/forgot', function(req, res) {
  res.render('forgot', {
    user: req.user
  });
});

router.get('/printform', (req, res) => {
    console.log(req.url);
    var queryString = req.url.substring( req.url.indexOf('?') + 1 );
    console.log(queryString);
    if(req.user)
    {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
            db.collection("empexit").findOne({empid:queryString}, function(err, result) {
        if (err) throw err;
                if(!result)
                    res.redirect('/empexit');
                else {
                    var parts = result.date.split("/");
                    date = new Date(parts[2], parts[1] - 1, parts[0]);
                    //result.addcomments2 = result.addcomments2.replace(/(?:\r|\n)/g, '&#13;&#10;');
                    //result.addcomments2 = result.addcomments2.split("\n").join("&#13;&#10;");
                    //result.addcomments2=result.addcomments2.replace(/\r?\n/g, '&#13;&#10;');
                    if(result.comments!=null)
                    {
                        result.comments = result.comments.replace(/\r?\n/g, '@#$%^*');
                    }
                    if(result.addcomments1!=null)
                        result.addcomments1 = result.addcomments1.replace(/\r?\n/g, '@#$%^*');
                    if(result.addcomments2!=null)
                        result.addcomments2 = result.addcomments2.replace(/\r?\n/g, '@#$%^*');
                    //result.addcomments2='gbwgbe&#10;efewwfeg';
                    //console.log(result.addcomments2);
                    res.render('printcheck', {
                        user: req.user,
                        date: result.date,
                        time: result.time,
                        name: result.name,
                        empid: result.empid,
                        designation: result.designation,
                        reportingto: result.reportingto,
                        dateofjoining: result.dateofjoining,
                        resigsubmit: result.resigsubmit,
                        resignotice: result.resignotice,
                        relievedon: result.relievedon,
                        worksatisfaction: result.worksatis,
                        comments: result.comments,
                        op1: result.op1,
                        op2: result.op2,
                        op3: result.op3,
                        op4: result.op4,
                        op5: result.op5,
                        op6: result.op6,
                        op7: result.op7,
                        op8: result.op8,
                        addcomments1: result.addcomments1,
                        addcomments2: result.addcomments2
                    });
                    console.log(result.name);
                }
        db.close();
    });
  });
  }
  else
  {
    res.redirect('/login');
  }
});

router.post('/edit', function(req, res) {
    //console.log(req.flash('success'));
    var list=Object.keys(req.body);
    if(list.length==1)
    {
        var isAjaxRequest = req.xhr;
        if(!isAjaxRequest){
            res.redirect('/');
        }
        else{
            res.send({redirect: '/edit?' + list[0]});
        }
    }
    else{
        res.redirect('/');
    }
});

router.get('/edit', (req, res) => {
    console.log(req.url);
    var queryString = req.url.substring( req.url.indexOf('?') + 1 );
    console.log(queryString);
    if(req.user)
    {
        MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            db.collection("empexit").findOne({empid: queryString}, function (err, result) {
                if (err) throw err;
                if (!result)
                    res.redirect('/empexit');
                else {
                    var parts = result.date.split("/");
                    date = new Date(parts[2], parts[1] - 1, parts[0]);
                    //result.addcomments2 = result.addcomments2.replace(/(?:\r|\n)/g, '&#13;&#10;');
                    //result.addcomments2 = result.addcomments2.split("\n").join("&#13;&#10;");
                    //result.addcomments2=result.addcomments2.replace(/\r?\n/g, '&#13;&#10;');
                    //result.addcomments2='gbwgbe&#10;efewwfeg';
                    //
                    if (result.comments != null)
                        result.comments = result.comments.replace(/\r?\n/g, '@#$%^*');
                    if (result.addcomments1 != null)
                        result.addcomments1 = result.addcomments1.replace(/\r?\n/g, '@#$%^*');
                    if (result.addcomments2 != null)
                        result.addcomments2 = result.addcomments2.replace(/\r?\n/g, '@#$%^*');
                    res.render('editform', {
                        user: req.user,
                        name: result.name,
                        empid: result.empid,
                        designation: result.designation,
                        reportingto: result.reportingto,
                        dateofjoining: result.dateofjoining,
                        resigsubmit: result.resigsubmit,
                        resignotice: result.resignotice,
                        relievedon: result.relievedon,
                        worksatisfaction: result.worksatis,
                        comments: result.comments,
                        op1: result.op1,
                        op2: result.op2,
                        op3: result.op3,
                        op4: result.op4,
                        op5: result.op5,
                        op6: result.op6,
                        op7: result.op7,
                        op8: result.op8,
                        addcomments1: result.addcomments1,
                        addcomments2: result.addcomments2,
                        rehireable: result.rehireable
                    });

                    console.log(result.name);
                }
                db.close();
            });
        });
    }
    else
    {
        console.log("HERE?");
        res.redirect('/login');
    }
});

router.post('/editform', (req, res) => {
    console.log("Hemant here");
    if(req.user) {
        console.log(req.body);
        console.log(req.headers);
        var d = (new Date()).toLocaleDateString();
        var myDate = (new Date()).toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
        console.log(d);
        console.log(myDate);
        MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            db.collection("empexit").findOne({empid: req.body.empid}, function (err, result) {
                if (err) throw err;
                if (!result) {
                    console.log("Here hjfbe");
                    res.redirect('/empexit');
                }
                else {
                    var myquery = {empid: req.body.empid};
                    var queryString = req.headers.referer.substring( req.headers.referer.indexOf('?') + 1 );
                    console.log(queryString);
                    if(queryString==req.body.empid) {
                        var myobj = {
                            empid: req.body.empid,
                            date: d,
                            time: myDate,
                            name: req.body.name,
                            designation: req.body.designation,
                            reportingto: req.body.reportingto,
                            dateofjoining: req.body.dateofjoining,
                            resigsubmit: req.body.resigsubmit,
                            resignotice: req.body.resignotice,
                            relievedon: req.body.relievedon,
                            worksatis: req.body.worksatisfaction,
                            comments: req.body.comments,
                            op1: req.body.op1,
                            op2: req.body.op2,
                            op3: req.body.op3,
                            op4: req.body.op4,
                            op5: req.body.op5,
                            op6: req.body.op6,
                            op7: req.body.op7,
                            op8: req.body.op8,
                            addcomments1: req.body.addcomments1,
                            addcomments2: req.body.addcomments2,
                            rehireable: req.body.rehireable
                        };
                        db.collection("empexit").updateOne(myquery, myobj, function (err, res) {
                            if (err) throw err;
                            if (!res) {
                                console.log("dfhwevufwyegfu");
                            }
                            console.log("1 record inserted");
                            db.close();
                        });
                        res.redirect('/empexit');
                    }
                    else
                        res.redirect('/empexit');
                }
            });
        });
    }
    else{
        res.redirect('/login');
    }
//res.render('logincheck', { user : req.user });
//res.status(200).send("pong!");
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      //var smtpTransport = nodemailer.createTransport("smtps://msrmhauth%40gmail.com:"+encodeURIComponent('Auth998402') + "@smtp.gmail.com:465");
        var transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // secure:true for port 465, secure:false for port 587
            auth: {
                user: 'msrmhauth@gmail.com',
                pass: 'Auth998402'
            }
        });
        var mailOptions = {
        to: user.email,
        from: 'msrmhauth@gmail.com',
        subject: 'Password Change - MSRMH Employee Exit Portal',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      transporter.sendMail(mailOptions, function(err) {
        req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {
      user: req.user
    });
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.save(function(err) {
          req.logIn(user, function(err) {
            done(err, user);
          });
        });
      });
    },
    function(user, done) {
      //var smtpTransport = nodemailer.createTransport("smtps://msrmhauth%40gmail.com:"+encodeURIComponent('Auth998402') + "@smtp.gmail.com:465");
        var transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // secure:true for port 465, secure:false for port 587
            auth: {
                user: 'msrmhauth@gmail.com',
                pass: 'Auth998402'
            }
        });
        var mailOptions = {
        to: user.email,
        from: 'msrmhauth@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      transporter.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/');
  });
});

router.get('/addform',function(req, res){
    var isAjaxRequest = req.xhr;
    if(req.user){
        if(!isAjaxRequest)
            res.redirect('/');
        else
            res.send({redirect:'/form001'});
    }
    else{
        if(!isAjaxRequest)
            res.redirect('/');
        else
            res.send({redirect:'/login'});
    }
});

router.get('/form001', function(req, res) {
  if(req.user)
  {
      res.render('logincheck', {
      user: req.user
    });
  }
  else
    res.redirect('/login');
});

router.post('/form001', (req, res) => {
    console.log("Hemant here");
    console.log(req.body);
    if(req.user) {
        var d = (new Date()).toLocaleDateString();
        var myDate = (new Date()).toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
        console.log(d);
        console.log(myDate);
        if (req.body.op1 == '')
            req.body.op1 = null;
        if (req.body.op2 == '')
            req.body.op2 = null;
        if (req.body.op3 == '')
            req.body.op3 = null;
        if (req.body.op4 == '')
            req.body.op4 = null;
        if (req.body.op5 == '')
            req.body.op5 = null;
        if (req.body.op6 == '')
            req.body.op6 = null;
        if (req.body.op7 == '')
            req.body.op7 = null;
        if (req.body.op8 == '')
            req.body.op8 = null;
        MongoClient.connect(url, function (err, db) {
            if (err) {
                console.log("HERE FOR NO REASON");
            }
            db.collection("empexit").findOne({empid: req.body.empid}, function (err, result1) {
                if (err) throw err;
                if (result1) {
                    res.send({error: "A form with this EMPID has already been entered"});
                    db.close();
                }
                else {
                    var myobj = {
                        rehireable: req.body.rehireable,
                        empid: req.body.empid,
                        date: d,
                        time: myDate,
                        name: req.body.name,
                        designation: req.body.designation,
                        reportingto: req.body.reportingto,
                        dateofjoining: req.body.dateofjoining,
                        resigsubmit: req.body.resigsubmit,
                        resignotice: req.body.resignotice,
                        relievedon: req.body.relievedon,
                        worksatis: req.body.worksatisfaction,
                        comments: req.body.comments,
                        op1: req.body.op1,
                        op2: req.body.op2,
                        op3: req.body.op3,
                        op4: req.body.op4,
                        op5: req.body.op5,
                        op6: req.body.op6,
                        op7: req.body.op7,
                        op8: req.body.op8,
                        addcomments1: req.body.addcomments1,
                        addcomments2: req.body.addcomments2
                    };
                    db.collection("empexit").insertOne(myobj, function (err, res2) {
                        if (err) throw err;
                        console.log("1 record inserted");
                        res.send({error: "Form has been successfully added!", redirect: '/empexit'});
                        db.close();
                    });
                }
            });
        });
    }
    else
        res.redirect('/login');
    //res.render('logincheck', { user : req.user });
    //res.status(200).send("pong!");
});

router.get('/excel', function(req, res, next) {
    if(req.user) {
        MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            db.collection("empexit").find({}).toArray(function (err, result) {
                if (err) throw err;
                var x = 0;
                var json = {
                    empdata: [{
                        'Employee Name': '',
                        'Employee ID': '',
                        'Date': '',
                        'Time': '',
                        'Designation': '',
                        'Reporting To': '',
                        'Date of Joining': '',
                        'Resignation Submitted On': '',
                        'Resignation Notice Period': '',
                        'Releived On': '',
                        'Work Satisfaction': '',
                        'Retirement': '',
                        'Career Advancement': '',
                        'Personal Reasons': '',
                        'Scale of Pay': '',
                        'Inadequate resources to perform duty': '',
                        'Dissatisfaction about work': '',
                        'Work culture': '',
                        'Interpersonal relationships in the department': '',
                        'Re-hireability': ''
                    }]
                };
                for (x = 0; x < result.length; x++) {
                    json.empdata.push({
                        'Employee Name': result[x].name,
                        'Employee ID': result[x]._id,
                        'Date': result[x].date,
                        'Time': result[x].time,
                        'Designation': result[x].designation,
                        'Reporting To': result[x].reportingto,
                        'Date of Joining': result[x].dateofjoining,
                        'Resignation Submitted On': result[x].resigsubmit,
                        'Resignation Notice Period': result[x].resignotice,
                        'Releived On': result[x].relievedon,
                        'Work Satisfaction': result[x].worksatis,
                        'Retirement': result[x].op1,
                        'Career Advancement': result[x].op2,
                        'Personal Reasons': result[x].op3,
                        'Scale of Pay': result[x].op4,
                        'Inadequate resources to perform duty': result[x].op5,
                        'Dissatisfaction about work': result[x].op6,
                        'Work culture': result[x].op7,
                        'Interpersonal relationships in the department': result[x].op8,
                        'Re-hireability': result[x].rehireable
                    });
                }
                var xls = json2xls(json.empdata);
                fs.writeFileSync('empdata.xlsx', xls, 'binary');
                //res.send({error:'efbwe'});
                res.download('./empdata.xlsx');
                //res.render('index', { user : req.user });
                //res.redirect('/');
                //console.log(result[0]);
                //console.log(result.length);
                db.close();
            });
        });
    }
    else{
        res.redirect('/login');
    }
});

module.exports = router;
