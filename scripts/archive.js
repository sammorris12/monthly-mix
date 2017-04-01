var fs = require('fs-extra');
var klawSync = require('klaw-sync');

module.exports = {
    compile: function() {
        fs.removeSync('.data/archive.json');
        fs.mkdirsSync('.data');

        var playlists = klawSync('.data');

        var archive = [];

        for (var i in playlists) {
            var playlist = fs.readJsonSync(playlists[i].path);
            archive[i] = {
                url: 'http://www.monthly.mx/' + playlist.year + '/' + playlist.month,
                handle: playlist.handle,
                colour: playlist.colour,
                month: playlist.month,
                timeStamp: Date.parse(playlist.month + ' ' + playlist.year)
            }
        }

        archive.sort(function(a, b) {
            return a.timeStamp - b.timeStamp;
        });

        fs.writeFileSync('.data/archive.json', JSON.stringify(archive));
    }
} 