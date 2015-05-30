firebase-tokenize
==============

Easily generate Firebase tokens from the command-line!

Installation
------------

Install via npm:

    npm install -g firebase-tokenize


Example
-------
    firebase-tokenize -n yourFirebase '{"uid": "america", "is": "bestest"}'

Arguments
----

### -n / --namespace
Your Firebase name.

### -e / --email
Your account email address (used for manual authentication).

### -p / --password
Your account email address (used for manual authentication).

### -s / --secret-index
The index of the Firebase's secret which should be used to generate the token.

### -d / --debug
Set the Firebase token to a debug token.

### -a / --admin
Set the Firebase token to an admin token.

### --expires
An epoch after which this token expires.

### --not-before
An epoch after which this token becomes valid.

Credits
-------
Development of this library is sponsored by [Rigidflame Consultants](http://www.rigidflame.com).
