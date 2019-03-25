var Howl = require('howler').Howl;
var Messages = require('../Messages');

var loaded = false;
var sprites = new Howl({
  urls : ['assets/sprites.ogg'],
  volume: 0.04 ,
  sprite : {
    rocket: [0, 430],
    explosion: [430, 945],
    alienRocket: [1374, 295],
    validate: [1669, 76],
    hit: [1746, 200]
  },
  onload : function(){
    Messages.post( Messages.ID.LOADED_SOUNDS, Messages.channelIDs.ROOT );
  }
});

var music;


var createNewHowl = function (level){
  music && music.stop();
  music = new Howl({
  urls: [`assets/music/m${level}.mp3`],
  loop: true,
  autoplay: true,
  volume: 0.3
});
};

var lowerGameVolume = function(){
  music && music.volume(0.1);
}

module.exports = {
  sprites : sprites,
  createNewHowl: createNewHowl,
  lowerGameVolume: lowerGameVolume
};
