var Kyot = require('kyot-sunday-playlists')
var Youtube = require("youtube-api");
var bunyan = require('bunyan');
var log = bunyan.createLogger({name: 'kyot-sunday-playlists'});

var accessToken = 'ya29.6AAz2nhaLw58pSKGJL-sWUOc83q2pAyo2NWEMMKVOTjVioAutiPMU8vcF7sCB0aVgP5ePDU3JszQ6w'


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
                console.log('Deleted playlist with id ' + item.id)
            });
        })
    })
}

deleteAllPlaylists();


var createPlaylists = function () {

    Kyot.getShows(function (err, shows) {
        log.info('Parsing complete, total shows ' + shows.length);


        var show = shows[3];
        var playlistTitle = new Date().getFullYear() + ' ' + show.date + ' - ' + show.hours[0].title;


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
//                console.log(err || playlist);
//                console.log('id --- ' + playlist.id)

            show.hours[0].songs.forEach(function (song, index) {
                var searchQuery = song.songArtist + ' ' + song.songTitle;
                console.log('Searching for ' + searchQuery);


                Youtube.search.list({
                    q: searchQuery,
                    part: 'snippet'
                }, function (err, data) {
                    //console.log('Search data result')
                    //console.log(err || JSON.stringify(data));
                    var matching = data.items.filter(function (item) {
                        var searchQueryResultTitle = item.snippet.title;
                        //console.log(searchQueryResultTitle);

                        var matchesArtist = searchQueryResultTitle.indexOf(song.songArtist) > -1;
                        var matchesTitle =  searchQueryResultTitle.indexOf(song.songTitle) > -1;

                        if (matchesArtist && matchesTitle) {
                            //console.log('Result matches: ' + searchQueryResultTitle);
                        }

                        return matchesArtist && matchesTitle;
                    });

                    if (!matching || typeof matching == 'undefined' || matching.length == 0) {
                        console.log('No matches: ' + searchQuery)
                        return;
                    } else {
                        console.log('Matching: ' + searchQuery);
                    }

                    var firstMatchingItem = matching[0];
                    //console.log('First matching item: ' + JSON.stringify(firstMatchingItem));
                    console.log('Inserting into playlist position: ' + index);

                    Youtube.playlistItems.insert({
                        part: 'snippet',
                        resource: {
                          snippet: {
                            playlistId: playlist.id,
                            resourceId:  firstMatchingItem.id,
                            position: 0
                          }
                        }
                      }, function (err, data) {
                            console.log(err || data.snippet.position + ' - Completed insert data into playlist' + data.snippet.title)
                      });

                });


            });

        });









    })

}








