define([
    'libs/bean',
    'libs/bonzo',
    'libs/qwery',
    'utils/loadJSON',
    'utils/scroller',
    'sc'
], function(
    bean,
    bonzo,
    qwery,
    loadJSON,
    scroller
) {
    var sound;

    return {
        init: function() {
            loadJSON('/soundcloud-keys.json', function(data) {
                SC.initialize({
                    client_id: data.id
                });
            });

            this.bindEvents();
        },

        bindEvents: function() {
            bean.on(document.body, 'click', '.playlist__entry', function(e) {
                this.playTrack(e.currentTarget.dataset.trackId);
            }.bind(this));
            bean.on(document.body, 'click', '.audio-controls', function(e) {
                this.controlsPlay();
            }.bind(this));
            bean.on(document.body, 'click', '.controls__buttons__skip', function(e) {
                if (bonzo(qwery('.controls')).hasClass('is-default') == false) {
                    this.onSkip();
                }
            }.bind(this));
        },

        controlsPlay: function() {
            id = bonzo(qwery('.post')).attr('data-current-track');

            if (id) {
                this.playTrack(id);
            } else {
                this.playTrack(bonzo(qwery('.playlist__entry')).attr('data-track-id'))
            }
        },

        loadingState: function(target, state) {
            if (state === true) {
                target.addClass("is-loading");
            } else {
                target.removeClass("is-loading");
            }
        },

        scrollToTrack: function(target) {
            scroller.scrollToElement(el, 1000, 'easeInQuad');
        },

        onPlay: function(target) {
            target.addClass('is-playing');
            bonzo(qwery('body')).attr('data-state', 'is-playing');
            this.updateNowPlaying();
        },

        onSkip: function() {
            next = bonzo(qwery('.is-playing')).next().attr('data-track-id');
            if (next) {
                this.playTrack(next, true);
            } else {
                first = bonzo(qwery('.playlist__entry')[0]).attr('data-track-id');
                this.playTrack(first);
            }
        },

        onStop: function(target) {
            bonzo(qwery('body')).attr('data-state', 'is-stopped');
            target.removeClass('is-playing');
        },

        getNowPlayingInfo: function() {
            return {
                "id"    : bonzo(qwery('.is-playing')).attr('data-track-id'),
                "color" : bonzo(qwery('.is-playing .playlist__entry__info')).attr('style'),
                "contrast" : bonzo(qwery('.is-playing')).attr('data-track-contrast'),
                "title" : qwery('.is-playing .playlist__entry__title')[0].textContent,
                "artist": qwery('.is-playing .playlist__entry__artist')[0].textContent,
                "permalink" : bonzo(qwery('.is-playing')).attr('data-track-permalink')
            }
        },

        updateNowPlaying: function() {
            track = this.getNowPlayingInfo();
            bonzo(qwery('.controls__buttons__soundcloud a')).attr('href', track['permalink']);
            bonzo(qwery('.is-changable')).attr("style", track['color'].replace('background-', ''));
            bonzo(qwery('.post')).attr('data-current-track', track['id']);
            bonzo(qwery('.controls')).removeClass('is-dark is-light is-very-dark is-default').addClass(track['contrast']).attr("style", track['color']);
            bonzo(qwery('.controls__buttons .input')).attr('style', track['color']);
            bonzo(qwery('.playlist')).attr("style", track['color'].replace(')', ', 0.2)').replace('rgb', 'rgba'));
            bonzo(qwery('.controls .controls__title__track-artist')).text(track['artist']);
            bonzo(qwery('.controls .controls__title__track-title')).text(track['title']);
        },
        
        updateProgressBar: function(duration, position) {
            bonzo(qwery('.progress-bar__current')).attr('style', 'width:' + (position / duration) * 100 + '%;')
        },

        newTrack: function(trackId, scrollTo) {
            context = this;

            // Set options for player
            var myOptions = {
                onload : function() {
                    // readyState 2 means failed or error in fetching track
                    if (this.readyState == 2) {
                        context.onSkip();
                    }
                    // Debug onfinish with this
                    // sound.setPosition(this.duration - 3000);
                },
                onfinish : function(){
                    this.onSkip();
                }.bind(this),
                onbufferchange: function() {
                    this.loadingState(el, sound.playState);
                }.bind(this),
                whileplaying: function() {
                    this.updateProgressBar(sound.durationEstimate, sound.position);
                }.bind(this),
                ondataerror: function() {
                    console.log("errorz");
                },
                onplay: function() {
                    this.loadingState(el, true);
                }.bind(this)
            }

            SC.whenStreamingReady(function() {
                var obj = SC.stream('/tracks/' + trackId, myOptions, function(obj){
                    obj.play();
                    sound = obj;
                    context.onPlay(el);
                    if (scrollTo) {
                        context.scrollToTrack(el);
                    }
                });
                sound.load();
            });
        },

        playTrack: function(trackId, scrollTo) {
            scrollTo = scrollTo || false;
            el = bonzo(qwery('#playlist__entry--' + trackId));
            current = bonzo(qwery('.is-playing'));

            if (sound) {
                // Check if it's the same track
                if (sound.url.split('/')[4] == trackId) {
                    if (el.hasClass('is-playing')) {
                        sound.pause();
                        this.onStop(el);
                    } else {
                        sound.play();
                        this.onPlay(el);
                        if (scrollTo) {
                            this.scrollToTrack(el);
                        }
                        this.loadingState(el, sound.playState);
                    }
                // If not, destroy old track and start again
                } else {
                    sound.stop();
                    this.onStop(current);
                    sound = undefined;
                    this.newTrack(trackId, scrollTo);
                }
            } else {
                this.newTrack(trackId, scrollTo);
            }
        }
    }
});