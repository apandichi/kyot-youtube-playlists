var Kyot = require('kyot-sunday-playlists')
var Youtube = require("youtube-api");
var bunyan = require('bunyan');
var log = bunyan.createLogger({name: 'kyot-sunday-playlists'});

var accessToken = 'ya29.6ACc8tx7r5b46nAmidmDZeeqmdQBDhLnC3V81rNl7Io666EODhhyNfQKywL_sjQz5S4znc387pp3MQ'


Youtube.authenticate({
    type: "oauth",
    token: accessToken
});

var deleteAllPlaylists = function () {

    Youtube.playlists.list({
        part: 'snippet,status',
        mine: true,
        maxResults: 50
    } , function (err, data) {
        console.log('Found playlists: ' + data.items.length);

        data.items.forEach(function (playlist) {
            Youtube.playlists.delete({
                id: playlist.id
            }, function (err, data) {
                console.log('Deleted playlist with id ' + playlist.id)
            });
        })
    })
}

var filterMatchingSongResults = function (items, song) {
    var matching = items.filter(function (item) {
        var matchesArtist = item.snippet.title.indexOf(song.songArtist) > -1;
        var matchesTitle =  item.snippet.title.indexOf(song.songTitle) > -1;
        return matchesArtist && matchesTitle;
    });

    return matching[0];
}

var bestMatchingItem = function (matching) {
    if (!matching || typeof matching == 'undefined' || matching.length == 0) {
        return;
    }
    return matching[0];
}

var parseHour = function (hour, playlist) {
    hour.songs.forEach(function (song) {
        var songArtistAndTitle = song.songArtist + ' ' + song.songTitle;
        console.log('Searching for song artist and title: ' + songArtistAndTitle);

        Youtube.search.list({
            q: songArtistAndTitle,
            part: 'snippet'
        }, function (err, data) {

            var matching = filterMatchingSongResults(data.items, song);
//            var firstMatchingItem = bestMatchingItem(matching);
            if (!matching) return;

            console.log('Inserting into playlist');

            Youtube.playlistItems.insert({
                part: 'snippet',
                resource: {
                  snippet: {
                    playlistId: playlist.id,
                    resourceId:  matching.id,
                    position: 0
                  }
                }
              }, function (err, data) {
                    console.log(err || data.snippet.position + ' - Completed insert data into playlist' + data.snippet.title)
              });
        });
    });
}

var createPlaylistsForShow = function (show) {
    show.hours.forEach(function (hour) {
        var playlistTitle = new Date().getFullYear() + ' ' + show.date + ' - ' + hour.title;

        Youtube.playlists.insert({
            part: 'snippet,status',
            resource: {
              snippet: {
                title: playlistTitle,
                description: playlistTitle
              },
              status: {
                privacyStatus: 'private'
              }
            }
        }, function (err, playlist) {
            parseHour(hour, playlist);
        });
    });



}


var createAllPlaylists = function () {
    Kyot.getShows(function (err, shows) {
        log.info('Parsing complete, total shows ' + shows.length);
        shows.forEach(createPlaylistsForShow)
    })
}


//deleteAllPlaylists();
createAllPlaylists();




