var Kyot = require('kyot-sunday-playlists')
var Youtube = require("youtube-api");
var async = require('async');

var bunyan = require('bunyan');
var log = bunyan.createLogger({name: 'kyot-sunday-playlists'});

var accessToken = 'ya29.8QDGugMXFgfklpBGn5YNOggDNbnrb-WyBqQix4DREdfgeX8-lZ6RgXTxpA6SO9tSdnh2VzXLrS79uA'


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
        log.info(err || 'Found playlists: ' + data.items.length);

        data.items.forEach(function (playlist) {
            Youtube.playlists.delete({
                id: playlist.id
            }, function (err, data) {
                log.info('Deleted playlist with id ' + playlist.id)
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
        log.debug(artistTokens + ' matches artist ' + item.snippet.title + ' ? ' + matchesArtist);

        var matchesTitle =  item.snippet.title.indexOf(song.songTitle) > -1;
        log.debug(song.songTitle + ' matches title ' + item.snippet.title + ' ? ' + matchesTitle);

        var matches = matchesArtist && matchesTitle;
        log.debug(item.snippet.title + ' matches: ' + matches);
        return matches;
    });

    return matching[0];
}

var parseHour = function (hour, playlist) {

    async.eachSeries(hour.songs, function (song, callback) {
        var songArtistAndTitle = song.songArtist + ' ' + song.songTitle;
        log.info('Searching ' + songArtistAndTitle + ' for playlist ' + playlist.snippet.title);

        Youtube.search.list({
            q: songArtistAndTitle,
            part: 'snippet',
            type: 'video'
        }, function (err, data) {

            var matching = filterMatchingSongResults(data.items, song);
            if (!matching) {
                log.warn('No match for ' + songArtistAndTitle + ' into playlist ' + playlist.snippet.title);
                callback();
                return;
            }

            log.info('Inserting ' + songArtistAndTitle + ' into playlist ' + playlist.snippet.title);

            Youtube.playlistItems.insert({
                part: 'snippet',
                resource: {
                  snippet: {
                    playlistId: playlist.id,
                    resourceId:  matching.id
                  }
                }
              }, function (err, data) {
                    if (err) {
                        log.error('Error while inserting ' + songArtistAndTitle + ' into playlist ' + playlist.snippet.title);
                        log.error('playlist id ' + playlist.id + ' matching id ' + JSON.stringify(matching.id));
                        log.error(err);
                        callback();
                        return;
                    }
                    log.info(
                        songArtistAndTitle +
                        ' --- completed insert into playlist ' +
                        playlist.snippet.title +
                        ' at position ' + data.snippet.position);
                    callback();
              });
        });
    });


}

var createPlaylistTitle = function (show, hour) {
    var monthNames = [ "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December" ];
    var year = new Date().getFullYear();
    var showMonth = monthNames.indexOf(show.date.split(" ")[0]);
    if (showMonth > new Date().getMonth()) {
        year = year - 1;
    }
    var playlistTitle = year + ' ' + show.date + ' - ' + hour.title;
    return playlistTitle;
}

var createPlaylistsForShow = function (show) {
    show.hours.forEach(function (hour) {
        var playlistTitle = createPlaylistTitle(show, hour);

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


module.exports = {
    deleteAllPlaylists: deleteAllPlaylists,
    createAllPlaylists: createAllPlaylists
}


//deleteAllPlaylists();
createAllPlaylists();