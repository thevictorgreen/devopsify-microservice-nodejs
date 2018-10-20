function AccountsController() {

  var that = this;
  var mongodb = require('mongodb').MongoClient;
  var url     = "mongodb://localhost:27017/cloudking";
  var sha256  = require('sha256');
  var stripe  = require("stripe")("sk_test_dpJAvobmpiiriLnH45rrQAlF");
  var mailgun_api_key = 'f7524fcd78e5b9f5e4d5978b200b9c74-bd350f28-a07312f3';
  var mailgun_domain = 'sandbox0799542bbd5a4827b4cd5bc885a92907.mailgun.org';
  var mailgun = require('mailgun-js')({apiKey: mailgun_api_key, domain: mailgun_domain});


  // CREATE NEW ITEM
  that.post = function(req,res,next) {

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With');

    var accountRecord = req.body.account;
    var stripeCustomer = {};
    stripeCustomer.email = accountRecord.company.authorized_users[0].user_email;
    stripeCustomer.description = accountRecord.company.company_name+","+accountRecord.company.authorized_users[0].user_name;

    stripe.customers.create(stripeCustomer, function onCustomerCreated(err,customer) {
      if (err) {
        console.log(err);
        res.json({"status":"error"});
      }
      else {
        accountRecord.company.company_billing.billing_id = customer.id;
        mongodb.connect(url, function(err,db) {
            if (err) {
                throw err;
            }
            else {
                db.collection("accounts").save( accountRecord, function(err,result){
                    if (err) {
                        throw err;
                        res.json({"status":"error"});
                        db.close();
                    }
                    else {
                        res.json({"status":"ok"});
                        console.log("Created Account Record");
                        db.close();
                    }
                });
            }
        });
      }
    });
    next();
  };


  that.payment = function(req,res,next) {

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With');

    var accountRecord = req.body.account;

    stripe.customers.createSource(req.body.cust_id, {source: req.body.token}, function onCardCreated(err,newCard) {
      if (err) {
        console.log(err);
        res.json({"status":"error"});
      }
      else {
        accountRecord.company.company_billing.has_card = true;
        accountRecord.company.company_billing.cards.push(newCard);
        mongodb.connect(url, function(err,db) {
            if (err) {
                throw err;
            }
            else {
                db.collection("accounts").save( accountRecord, function(err,result){
                    if (err) {
                        throw err;
                        res.json({"status":"error"});
                        db.close();
                    }
                    else {
                        var results = {};
                        results.status = "SUCCESS";
                        results.data = accountRecord;
                        res.json(results);
                        console.log("Credit Card Created");
                        db.close();
                    }
                });
            }
        });
      }
    });
    next();
  };


  that.auth = function(req,res,next) {

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With');

    var accountRecord = req.body.account;
    var email = req.body.email;

    mongodb.connect(url, function(err,db) {
        if (err) {
            throw err;
        }
        else {
            db.collection("accounts").find(accountRecord).toArray(function(err,result){
                if (err) {
                    throw err;
                    res.json({"status":"error"});
                    db.close();
                }
                else {
                    var results = {};
                    if ( result.length == 0 ) {
                      res.json({"status":"ERROR"});
                      db.close();
                    }
                    else {

                      results.status = "ERROR";

                      for (var i = 0;i < result[0].company.authorized_users.length;i++) {
                        if (email == result[0].company.authorized_users[i].user_email) {
                          results.status = "SUCCESS";
                          results.data = result[0];
                          break;
                        }
                      }

                      res.json(results);
                      db.close();
                    }
                }
            });
        }
    });
    next();
  };


  that.authemail = function(req,res,next) {

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With');

    var accountRecord = req.body.account;
    var email = req.body.email;

    mongodb.connect(url, function(err,db) {
        if (err) {
            throw err;
        }
        else {
            db.collection("accounts").find(accountRecord).toArray(function(err,result){
                if (err) {
                    throw err;
                    res.json({"status":"error"});
                    db.close();
                }
                else {
                    var results = {};
                    if ( result.length == 0 ) {
                      res.json({"status":"ERROR"});
                      db.close();
                    }
                    else {

                      results.status = "ERROR";

                      for (var i = 0;i < result[0].company.authorized_users.length;i++) {
                        if (email == result[0].company.authorized_users[i].user_email) {
                          results.status = "SUCCESS";
                          results.data = result[0];
                          break;
                        }
                      }

                      res.json(results);
                      db.close();
                    }
                }
            });
        }
    });
    next();
  };


  // SEND EMAIL MESSAGE TO USER ACCOUNT
  that.sendemail = function(req,res,next) {

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With');

    var messageRecord = req.body.message;

    mailgun.messages().send(messageRecord, function(err,body) {
      if (err) {
        throw err;
        res.json({"status":"error"});
      }
      else {
        console.log("SENT MESSAGE");
        var results = {};
        results.status = "SUCCESS";
        results.data = body.message;
        res.json(results);
      }
    });
    next();
  };


  // RETREIVE ALL ITEMS
  that.get = function(req,res,next) {

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With');


    mongodb.connect(url, function(err,db) {
        if (err) {
            throw err;
        }
        else {
            db.collection("accounts").find().toArray(function(err,result){
                if (err) {
                    throw err;
                    res.json({"status":"error"});
                    db.close();
                }
                else {
                    var results = {};
                        results.status = "SUCCESS";
                        results.data = result;
                    res.json(results);
                    db.close();
                }
            });
        }
    });
    next();
  };


  // RETREIVE ALL ITEMS MATCHING A PARAMETER
  that.getByValue = function(req,res,next) {

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With');

    value = req.params.value;

    mongodb.connect(url, function(err,db) {
        if (err) {
            throw err;
        }
        else {
          var query = {$text:{$search: value}};
          db.collection("accounts").find(query).toArray(function(err,result){
            if (err) {
              throw err;
              res.json({"status":"error"});
              db.close();
            }
            else {
              var results = {};
              results.status = "SUCCESS";
              results.data = result;
              res.json(results);
              db.close();
            }
          });
        }
    });
    next();
  };


  // UPDATE ITEM MATCHING THIS _id
  that.put = function(req,res,next) {

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With');

    var accountRecord = req.body.account;

    mongodb.connect(url, function(err,db) {
        if (err) {
            throw err;
        }
        else {
            db.collection("accounts").save( accountRecord, function(err,result){
                if (err) {
                    throw err;
                    res.json({"status":"error"});
                    db.close();
                }
                else {
                    res.json({"status":"ok"});
                    console.log("Account Updated");
                    db.close();
                }
            });
        }
    });
    next();
  };


  // REMOVE ITEM MATCHING this _id
  that.delete = function(req,res,next) {

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With');

    var accountRecord = {};
    accountRecord._id = req.params.value;

    mongodb.connect(url, function(err,db) {
        if (err) {
            throw err;
        }
        else {
            db.collection("accounts").remove( accountRecord, function(err,result){
                if (err) {
                    throw err;
                    res.json({"status":"error"});
                    db.close();
                }
                else {
                    res.json({"status":"ok"});
                    console.log("Account Record Removed");
                    db.close();
                }
            });
        }
    });
    next();
  };

};
module.exports = new AccountsController();
