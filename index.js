#!/usr/bin/env node

var FirebaseLogin = require('firebase-login'),
    FirebaseTokenGenerator = require('firebase-token-generator'),
    Firebase = require('firebase'),
    request = require('request'),
    fs = require('fs'),
    Promise = require('es6-promise').Promise,
    argv = require('minimist')(process.argv.slice(2));

if (argv.h || argv.help) {
  var help = "firebase-tokenize \n\n\
   -n {FIREBASE} \n\
   {TOKEN JSON} \n\n\
   OPTIONAL \n\
   -e {EMAIL} \n\
   -p {PASSWORD} \n\
   -s {SECRET INDEX} \n\
   -d {DEBUG TOKEN} \n\
   -a {ADMIN TOKEN} \n\
   --expires {EXPIRES} \n\
   --not-before {NOT BEFORE}\n";

  console.log(help);
  return;
}

function useLocalCredentials() {
  return new Promise(function (resolve, reject) {
    var namespace = argv.n || argv.namespace;
    if (!namespace) return reject("No namespace (i.e. Firebase) provided!");

    fs.readFile(process.env.HOME + '/.firebaserc', function (err, buf) {
      if (err) return reject(err);

      var proposedCreds = JSON.parse(buf.toString());
      if (proposedCreds.token) {
        var tokenURL = 'https://admin.firebase.com/firebase/' + namespace + '/token?token=' + proposedCreds.token;

        request.get(tokenURL, function (error, response, body) {
          if (error) return reject(error);
          var data = JSON.parse(body);
          resolve(data.personalToken);
        });
      } else {
        return reject(err);
      }
    });
  });
}

function useSuppliedCredentials() {
  return new Promise(function (resolve, reject) {
    var namespace = argv.n || argv.namespace,
        email = argv.e || argv.email,
        password = argv.p || argv.password,
        ref;

    if (!namespace) return reject("No namespace (i.e. Firebase) provided!");
    if (!email || !password) return reject("No email or password provided! (Use `firebase login` to store credentials)");

    ref = new Firebase('https://' + namespace + '.firebaseio.com');

    FirebaseLogin(ref, {
            email: email,
            password: password
        },
        function (error, auth, token) {
          if (error) return reject(error);
          else resolve(token);
        }
    );
  });
}

function getCredentials() {
  return new Promise(function (resolve, reject) {
    useLocalCredentials()
      .then(resolve)
      .catch(function () {
        useSuppliedCredentials()
          .then(resolve)
          .catch(reject);
      });
  });
}

function getSecrets(token) {
  return new Promise(function (resolve, reject) {
    var namespace = argv.n || argv.namespace;
    if (!namespace) return reject("No namespace (i.e. Firebase) provided!");

    request('https://' + namespace + '.firebaseio.com/.settings/secrets.json?auth=' + token, function (err, resp, body) {
      if (err) return reject(err);

      var data = JSON.parse(body);
      if (data.error)
        return reject(data.error)
      else
        resolve(data);
    });
  });
}

function getToken(secrets) {
  return new Promise(function (resolve, reject) {
    var secretIndex = parseInt(argv.s || argv['secret-index'] || Math.random()*secrets.length, 10),
        expires = parseInt(argv.expires, 10),
        notBefore = parseInt(argv['not-before'], 10)
        options = {
          debug: argv.d || argv.debug || false,
          admin: argv.a || argv.admin || false
        };

    expires && (options.expires = expires);
    notBefore && (options.notBefore = notBefore);

    if (secretIndex >= secrets.length) return reject("Invalid secret index!");

    var secret = secrets[secretIndex],
        generator = new FirebaseTokenGenerator(secret),
        json, token;

    try {
      json = JSON.parse(argv._[0])
    } catch (err) {
      return reject("Invalid JSON supplied for token!")
    }

    token = generator.createToken(json, options);
    resolve(token);
  });
}

getCredentials()
  .then(getSecrets)
  .then(getToken)
  .then(console.log)
  .then(process.exit) // Cuts off firebase connection
  .catch(function (err) {
    console.log("Error: " + err);
    process.exit(2);
  })
