var Kyot = require('kyot-sunday-playlists')
var Youtube = require("youtube-api");
var bunyan = require('bunyan');
var log = bunyan.createLogger({name: 'kyot-sunday-playlists'});

var accessToken = 'ya29.2wBNUEVVl1lvdRG3E4Co3VC5-H-gA8QATVROjf08blLQHoV2arB1BpkExiNJuDzlM35toApeREi0tQ'


Youtube.authenticate({
    type: "oauth",
    token: accessToken
});


    Kyot.getShows(function (err, shows) {
        log.info('Parsing complete, total shows ' + shows.length);
        var playlistTitle = new Date().getFullYear() + ' ' + shows[0].date + ' - ' + shows[0].hours[0].title;
    })


var playlistTitle = 'test playlist';



Youtube.playlists.insert({
    part: 'snippet,status',
    resource: {
      snippet: {
        title: playlistTitle,
        description: 'A private playlist created with the YouTube API'
      },
      status: {
        privacyStatus: 'private'
      }
    }
}, function (err, playlist) {
    console.log(err || playlist);
    console.log('id --- ' + playlist.id)

    Youtube.search.list({
        q: 'dogs',
        part: 'snippet'
    }, function (err, data) {
        console.log('search data')
        console.log(err || data.items[0].id);

        Youtube.playlistItems.insert({
                part: 'snippet',
                resource: {
                  snippet: {
                    playlistId: playlist.id,
//                    resourceId: {
//                        videoId: id,
//                        kind: 'youtube#video'
//                      }
                        resourceId:  data.items[0].id
                  }
                }
              });
    });

});


