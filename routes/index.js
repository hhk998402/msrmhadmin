var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = require('../models/User');

var session = require('express-session')
var nodemailer = require('nodemailer');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');
var async = require('async');
var crypto = require('crypto');
var flash = require('express-flash');

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://hhk998402:SkillRack998@quizcluster-shard-00-00-1gbtm.mongodb.net:27017,quizcluster-shard-00-01-1gbtm.mongodb.net:27017,quizcluster-shard-00-02-1gbtm.mongodb.net:27017/quiz?ssl=true&replicaSet=QuizCluster-shard-0&authSource=admin";
//var User = require('../app.js');
//var User = mongoose.model('User', userSchema);

router.get('/', function(req, res){
  //if(req.user)
  //{
    if(req.user)
    {
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
                db.collection("empexit").findOne({empid:req.user.username}, function(err, result) {
            if (err) throw err;
            if(result)
              res.render('index', {
              title: 'Employee Exit Form',
              user: req.user,
              formexist: true
              });
            else
              res.render('index', {
              title: 'Employee Exit Form',
              user: req.user,
              formexist: false
              });
            db.close();
        });
    });
    }
        else
        {
          res.render('index', {
              title: 'Employee Exit Form',
              user: req.user
        });
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

router.get('/login', function(req, res) {
  res.render('login', {
    user: req.user
  });
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
        if(re.test(req.body.email))
        {
            req.flash('error3','Please enter Valid EMAIL');
            flag=false;
        }

        if(!flag)
        {
          res.render('signup', {
            user: req.user
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
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
            db.collection("empexit").findOne({empid:req.user.username}, function(err, result) {
        if (err) throw err;
        var parts = result.date.split("/");
        date = new Date(parts[2], parts[1] - 1, parts[0]);
        result.addcomments2 = result.addcomments2.replace(/(?:\r\n|\r|\n)/g, '&#13;&#10;');
        console.log(date);
            res.render('printcheck', { user : req.user ,date:result.date, time:result.time,name: result.name,empid:result.empid,designation:result.designation,reportingto:result.reportingto,dateofjoining:result.dateofjoining,resigsubmit:result.resigsubmit,resignotice:result.resignotice,relievedon:result.relievedon,worksatisfaction:result.worksatis,comments:result.comments,op1:result.op1,op2:result.op2,op3:result.op3,op4:result.op4,op5:result.op5,op6:result.op6,op7:result.op7,op8:result.op8,addcomments1:result.addcomments1,addcomments2:result.addcomments2});
            console.log(result.name);
        db.close();
    });
  });
});

router.get('/delete', function(req, res) {
  MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var myquery = { empid: req.user.username };
  db.collection("empexit").deleteOne(myquery, function(err, obj) {
    if (err) throw err;
    console.log("1 document deleted");
    res.redirect('/');
    db.close();
    });
  });
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
      var smtpTransport = nodemailer.createTransport("smtps://msrmhauth%40gmail.com:"+encodeURIComponent('Auth998402') + "@smtp.gmail.com:465");
      var mailOptions = {
        to: user.email,
        from: 'msrmhauth@gmail.com',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
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
      var smtpTransport = nodemailer.createTransport("smtps://msrmhauth%40gmail.com:"+encodeURIComponent('Auth998402') + "@smtp.gmail.com:465");
      var mailOptions = {
        to: user.email,
        from: 'msrmhauth@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/');
  });
});

router.get('/form001', function(req, res) {
  MongoClient.connect(url, function(err, db) {
        if (err) throw err;
            db.collection("empexit").findOne({empid:req.user.username}, function(err, result) {
        if (err) throw err;
        if(result)
          res.redirect('/');
        else
          res.render('logincheck', {
             user: req.user
          });
        db.close();
    });
});
});

router.post('/form001', (req, res) => {
    console.log("Hemant here");
    console.log(req.body);
    var d = (new Date()).toLocaleDateString();
    var myDate = (new Date()).toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
    console.log(d);
    console.log(myDate);
    MongoClient.connect(url, function(err, db) {
          if (err) throw err;
          var myobj = { empid : req.user.username, date:d, time:myDate,name: req.body.name, designation: req.body.designation, reportingto:req.body.reportingto, dateofjoining:req.body.dateofjoining, resigsubmit:req.body.resigsubmit, resignotice:req.body.resignotice, relievedon:req.body.relievedon, worksatis:req.body.worksatisfaction,comments:req.body.comments, op1:req.body.op1, op2:req.body.op2, op3:req.body.op3, op4:req.body.op4, op5:req.body.op5, op6:req.body.op6, op7:req.body.op7, op8:req.body.op8, addcomments1:req.body.addcomments1, addcomments2:req.body.addcomments2 };
          db.collection("empexit").insertOne(myobj, function(err, res) {
            if (err) throw err;
            console.log("1 record inserted");
            db.close();
          });
        });
    //res.render('logincheck', { user : req.user });
    res.redirect('/');
    //res.status(200).send("pong!");
});

module.exports = router;
