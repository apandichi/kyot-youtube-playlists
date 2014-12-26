var Kyot = require('kyot-sunday-playlists')
var Youtube = require("youtube-api");
var bunyan = require('bunyan');
var log = bunyan.createLogger({name: 'kyot-sunday-playlists'});

var accessToken = 'ya29.6AD8YdoErHMJC8onO5VuaJIbeGTY5ctgGT_9sIjQfO7ZblrBZ9xO90CDZ_r38NImiH_LBYw8nFYCAg'


Youtube.authenticate({
    type: "oauth",
    token: accessToken
});

var artistSplitTokens = ['&', ','];

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
        var artistTokens = song.songArtist.split(/[&,]+/).map(function (str) {return str.trim()});

        var matchesArtist = artistTokens.reduce(function (prev, curr) {
            return prev && (item.snippet.title.indexOf(curr) > -1);
        }, true);
        console.log(artistTokens + ' matches artist ' + item.snippet.title + ' ? ' + matchesArtist);

        var matchesTitle =  item.snippet.title.indexOf(song.songTitle) > -1;
        console.log(song.songTitle + ' matches title ' + item.snippet.title + ' ? ' + matchesTitle);

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

            //console.log(matching.id + ' Requesting insert into playlist ' + playlist.id);

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
                    //console.log(err || 'Completed request to insert into playlist ' + data.snippet.title)
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


deleteAllPlaylists();
//createAllPlaylists();




