var Kyot = require('kyot-sunday-playlists')
var Youtube = require("youtube-api");
var bunyan = require('bunyan');
var log = bunyan.createLogger({name: 'kyot-sunday-playlists'});

Youtube.authenticate({
    type: "jwt"
  , email: "91395162690-0l7o4si1s9np5f2d4b24gfrb4bkl15n8@developer.gserviceaccount.com"
  , keyFile: 'kyot-sunday-playlists-e72f233718d2.pem'
  , key: null
  , subject: null // optional
  , scopes: ["https://www.googleapis.com/auth/youtube"]
}).authorize(function (err, data) {
    if (err) { throw err; }

Kyot.getShows(function (err, shows) {
    log.info('Parsing complete, total shows ' + JSON.stringify(shows))
})
    /* Access resources */
    var results = Youtube.search.list({
        part: 'snippet',
        q: 'dogs', maxResults: 25
    }, function (err, data) {
        console.log(err || data);
    })



});
