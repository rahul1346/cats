var express = require('express');
var mysql = require('mysql');
var util = require('util');
var createError = require('http-errors');

var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var bcrypt = require('bcryptjs');

var router = express.Router();

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password"
});

router.post('/register', function(req, res,next) {
  con.connect(function(query, err) {
    if (err) {
      //console.log("Catching error here: ", err);
      //throw err;
    }
    console.log('Body = ', req.body);
    console.log("TYpe of boyd ", typeof(req.body));
    const body = JSON.parse(JSON.stringify(req.body));
    const birthday = body.hasOwnProperty('birthday') ? body.birthday : null;
    const breed = body.hasOwnProperty('breed') ? body.breed : null;
    const imageUrl = body.hasOwnProperty('imageUrl') ? body.imageUrl : null;
    const name = body.hasOwnProperty('name') ? body.name : null;
    const password = body.hasOwnProperty('password') ? body.password : null;
    const username = body.hasOwnProperty('username') ? body.username : null;
    const weight = body.hasOwnProperty('weight') ? body.weight : null;
    if (!name || !password || !username || !weight) {
      res.status(400).send("Malformed request: name, password, username and weight are required to register");
      return;
    }
    var hashedPassword = bcrypt.hashSync(password, 8);
    console.log("Connected!");
    var queryPrefix = "insert into cats.cats (birthday, breed, imageUrl, name, password, username, weight) values (";
    var querySuffix = util.format(
      "'%s', '%s','%s','%s','%s','%s','%s');",
      birthday,
      breed,
      imageUrl,
      name,
      hashedPassword,
      username,
      weight);

    var query = queryPrefix + querySuffix;
    //var query = 'select * from cats.cats;'
    con.query(query, function (err, result) {
      if (err) {
        if (err.hasOwnProperty('code') && err.code == 'ER_DUP_ENTRY') {
          //console.log("Properties = ", Object.getOwnPropertyNames(err));
          //console.log("ERROR RECIEVED", err);
          res.status(400).send(err.sqlMessage)
        } else {
          console.log("ERROR is ", err);
          res.status(500).send("Internal Server Error")
        }
        return
        // XXX Can check the error type from the database and throw a 400 if it's a user error (input) or a 500 if it's
        // a server error, database is down etc.
        //throw err;
      } else {
        console.log("Result: ", result);
        res.send(body);
      }
    });
  });
});

const secret = 'our-little-secret'

function verifyToken(req, res, next) {
  
  // check header or url parameters or post parameters for token
  //var token0 = req.headers['authToken'];
  var token = req.headers['authtoken'];
  if (!token)
    return res.status(403).send({ auth: false, message: 'No token provided.' });

  // verifies secret and checks exp
  jwt.verify(token, secret, function(err, decoded) {
    if (err)
      return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });

    // if everything is good, save to request for use in other routes
    console.log("Decoded = ", decoded);
    req.userId = decoded.id;
    next();
  });

}

router.post('/login', function(req, res, next){
	//post request for login because need to write to lastSeenAt

	con.connect(function(query, err) {
    if (err) {
      console.log("Catching error here: ", err);
      //throw err;
    }
    console.log('Body = ', req.body);
    const body = JSON.parse(JSON.stringify(req.body));
    const password = body.hasOwnProperty('password') ? body.password : null;
    const username = body.hasOwnProperty('username') ? body.username : null;
    console.log("Connected!");
    console.log('Body = ', req.body);
    if (!username || !password) {
      res.status(400).send("Malformed request username and password are required");
    }
    var query = util.format("select username, password from cats.cats where username = '%s';",
      req.body.username);

    con.query(query, function (err, result) {
      if (err) {
        throw err;
      }
      console.log("Result: ", result);
      if (result.length === 0) {
        res.status(400).send("no such username");
        return;
      } else {
        var passwordIsValid = bcrypt.compareSync(password, result[0].password);
        if (!passwordIsValid) {
          return res.status(400).send("invalid password");
        }
        var token = jwt.sign({ id: username }, secret, {
          expiresIn: 86400 // expires in 24 hours
        });
        query = util.format("update cats.cats set lastSeenAt = CURRENT_TIMESTAMP where username = '%s';", username);
        con.query(query, function(err, result) {
          if (err) {
            console.log("Error updating: ", err);
          }
        });
        res.send({ authToken: token });
      }
    });
  });
});


router.post('/', verifyToken, function(req, res, next) {
	con.connect(function(query, err) {
    if (err) {
      console.log("Catching error here: ", err);
      //throw err;
    }
    console.log("Connected!");
    console.log('Body = ', req.body);
    const body = JSON.parse(JSON.stringify(req.body));
    const id = body.hasOwnProperty('id') ? body.id : null;
    const username = body.hasOwnProperty('username') ? body.username : null;
    const name = body.hasOwnProperty('name') ? body.name : null;
    var query = "select * from cats.cats "
    if (id || username || name) {
      query = query + "where ";
    }
    if (id) {
      query = query + " id = '"+id+"'";
    }
    if (username) {
      query = query + " username = '"+username+"'";
    }
    if (name) {
      query = query + " name = '"+name+"'";
    }
    query = query + " order by lastSeenAt desc;"
    console.log("QUERY = ", query);
    con.query(query, function (err, result) {
      if (err) {
        throw err;
      }
      console.log("Result: ", result);
      res.send(result);
    });
  });
});

router.get('/random', function(req, res, next) {
	con.connect(function(query, err) {
    if (err) {
      console.log("Catching error here: ", err);
      //throw err;
    }
    console.log("Connected!");
    var query = "select imageUrl, name, breed from cats.cats order by RAND() limit 1;"
    //console.log('Body = ', req.body);
    con.query(query, function (err, result) {
      if (err) {
        throw err;
      }
      console.log("Result: ", result);
      res.send(result);
    });
  });
});

module.exports = router;
