var Messages = require("../Messages");
var utils = require('../Utils.js');

var id = utils.idGenFactory();

var Sounds = require('../Sounds');

/**
 * Check if the position is within the bounds with respect the margins
 * The space to which the margins are applied are [ [0,1], [0,1] ]
 * Margins are uniform same for left/right and top/down
 */
var isOutsideBounds = function(margins, position){
  return position[0] > (1-margins[0]) ||
         position[0] < margins[0] ||
         position[1] > 1-margins[1] ||
         position[1] < margins[1];
};
//Returns the current acceleration value
var Patterns = {
  "straight" : function straightP(deltaT, timestamp){
    return [0, this.maxSpeed[1]];
  },
  "left" : function leftP(deltaT, timestamp){
    return [ -this.maxSpeed[0], 0 ];
  },
  "right" : function leftP(deltaT, timestamp){
    return [ this.maxSpeed[0], 0 ];
  },
  "downLeft" : function downLeftP(deltaT, timestamp){
    return [ -this.maxSpeed[0],  this.maxSpeed[1] ];
  },
  "downRight":function downRightP(deltaT, timestamp){
    return [  this.maxSpeed[0],  this.maxSpeed[1] ];
  },
  "upLeft": function upLeftP(deltaT, timestamp){
    return [ -this.maxSpeed[0], -this.maxSpeed[1] ];
  },
  "upRight": function upRightP(deltaT, timestamp){
    return [  this.maxSpeed[0], -this.maxSpeed[1] ];
  },
  "triangle" : function squareP(deltaT, timestamp){
    var t0 = timestamp;
    var p = this.pattern = function(deltaT, timestamp){
      var elapsed = timestamp - t0;
      var c = Math.floor(elapsed / 2000) % 2;
      if( c === 0 ) return [this.maxSpeed[0], this.maxSpeed[1]];
      else if( c === 1 ) return [-this.maxSpeed[0], this.maxSpeed[1]];
      else {
        console.log( "Invariant break : c should be in [0,1], was ", c);
        return [0, 0.00001];
      }
    };
    return p.call(this, deltaT, timestamp);
  },
  "largeScan" : function lScanPattern(deltaT, timestamp){
    var state = 0;
    var lastTurnPosition = 0;
    var p = this.pattern = function initializedLScan(deltaT, timestamp){
      if(state === 0){
        if( this.position[1] > 0.1 ) state = 1;
        return Patterns.straight.call(this, deltaT, timestamp);
      }
      else if(state === 1){
        if( this.position[0] <= 0.1 ){
          lastTurnPosition = this.position[1];
          state = 2;
        }
        return Patterns.left.call(this, deltaT, timestamp);
      }
      else if(state === 2){
        if( this.position[1] > lastTurnPosition + 0.1 ) {
          if(this.position [0] > 0.5) state = 1;
          else state = 3;
        }
        return Patterns.straight.call(this, deltaT, timestamp);
      }
      else if(state === 3){
        if( this.position[0] >= 0.9 ) {
          lastTurnPosition = this.position[1];
          state = 2;
        }
        return Patterns.right.call(this, deltaT, timestamp);
      }
    };
    return p.call(this, deltaT, timestamp);
  },
  "pong": function pongP(deltaT, timestamp){
    var state = 0;
    var p = this.pattern = function initializedLScan(deltaT, timestamp){
      if(state === 0){
        if( this.position[0] > 0.9 ) state = 1;
        return Patterns.downRight.call(this, deltaT, timestamp);
      }
      else if(state === 1){
        if( this.position[1] > 0.8 ) state = 2;
        return Patterns.downLeft.call(this, deltaT, timestamp);
      }
      else if(state === 2){
        if( this.position[0] < 0.1 ) state = 3;
        return Patterns.upLeft.call(this, deltaT, timestamp);
      }
      else if(state === 3){
        if( this.position[1] < 0.1 ) state = 4;
        return Patterns.upRight.call(this, deltaT, timestamp);
      }
      else if(state === 4){
        return Patterns.straight.call(this, deltaT, timestamp);
      }
    };
    return p.call(this, deltaT, timestamp);

  }
};

//Baddie
/**
 * @param config : object containing the following keys
 *  - position : vec2 (eg array of two elements)
 *  - maxSpeed : vec2
 *  - size : vec2
 *  - life : Number
 *  - weight : Number
 *  - pattern : (deltaT: Number, timestamp: Number) => acceleration: vec2
 */
var Monster = function( config ) {
  if( !config ) throw "WTF PEOPLE! no config object were provided to Monster "+
                      "therefore I am not able to build my minion. Sad day!";
  this.position     = config.position || [ Math.random(), -0.2];
  this.speed        = config.speed || [0,0];
  this.maxSpeed     = config.maxSpeed || [0.0001, 0.0001];
  this.size         = config.size || [0.1, 0.1];
  this.life         = config.life || 1;
  this.weight       = config.weight || 1;
  this.pattern      = config.pattern ? (Patterns[config.pattern]).bind(this) :
                                       (Patterns.straight).bind(this);
  this.id           = this.PRFX_ID + id();
  this.value        = config.value || 50;
}

Monster.prototype = {
  PRFX_ID : this.PRFX_ID || null,
  tick: function( deltaT, world ){
    if(this.afterMove) {
      this.tick = function( dt, w ){
        this.move(dt, w);
        this.afterMove(dt, w);
      };
    }
    else {
      this.tick = this.move;
    }
    this.tick( deltaT, world );
  },
  move: function(deltaT, world){
    this.speed = this.pattern(deltaT, world.timestamp);
    //this.speed[0] = Math.min( this.maxSpeed[0], this.speed[0] + acc[0]);
    //this.speed[1] = Math.min( this.maxSpeed[1], this.speed[1] + acc[1]);
    this.position[0] += this.speed[0] * deltaT;
    this.position[1] += this.speed[1] * deltaT;
    if( this.position[1] > 1) {
      Messages.post( Messages.ID.BADDIE_WIN, Messages.channelIDs.GAME, this.id);
      Messages.post( Messages.ID.ALERT, Messages.channelIDs.FX);
      world.stats.miss( this.PRFX_ID, world.timestamp );
    }
    this.flash=false;
  },
  collide: function( world ){
    if( world.ship.isInvincible ) return;
    if( this.life > 0 ){
      this.life--;
      this.position[1] = this.position[1] - (0.08 / (this.weight * this.weight)) ;
      this.speed[1] = -0.0001;
      this.flash=true;
    }
    else {
      Messages.post( Messages.ID.BADDIE_DESTROYED, Messages.channelIDs.GAME, this.id);
      Messages.post( Messages.ID.UPDATE_SCORE, Messages.channelIDs.GAME, this.value);
      Messages.post( Messages.ID.EXPLOSION, Messages.channelIDs.FX, this.position);
      Sounds.sprites.play('explosion');
      world.stats.kill( this.PRFX_ID, world.timestamp );
    }
  }
};

var Zouro = function( position, movePattern, _id){
    this.PRFX_ID = _id;
    Monster.call( this, {
    position     : position || [ Math.random(), -0.2],
    maxSpeed     : [0.0001, 0.0001],
    speed        : [0, 0.0001],
    size         : [0.04, 0.04],
    weight       : 1,
    life         : 1,
    pattern      : movePattern || "triangle",
  });
};
Zouro.prototype = Object.create( Monster.prototype );
Zouro.prototype.constructor = Zouro;

var Ouno = function( position, movePattern, _id){
    this.PRFX_ID = _id;
    Monster.call( this, {
    position     : position || [ Math.random(), -0.2],
    maxSpeed     : [0.0003, 0.0003],
    speed        : [0, 0.0003],
    size         : [0.04, 0.04],
    weight       : 1,
    life         : 1,
    pattern      : movePattern || "largeScan",
    value        : 100
  });
};
Ouno.prototype = Object.create( Monster.prototype );
Ouno.prototype.constructor = Ouno;

var Jira = function( position, movePattern, _id){
    this.PRFX_ID = _id;
    Monster.call( this, {
    position     : position || [ Math.random(), -0.2],
    maxSpeed     : [0.0003, 0.0003],
    speed        : [0, 0.0003],
    size         : [0.04, 0.04],
    weight       : 1,
    life         : 1,
    pattern      : movePattern || "largeScan",
    value        : 100
  });
};
Jira.prototype = Object.create( Monster.prototype );
Jira.prototype.constructor = Jira;


var Douo = function( position, movePattern, _id ){
  Monster.call( this, {
    position     : position || [ Math.random(), -0.2],
    maxSpeed     : [0.0001, 0.0001],
    speed        : [0, 0.0001],
    size         : [0.04, 0.04],
    weight       : 4,
    life         : 1,
    pattern      : movePattern || "pong",
    value        : 200
  });
    this.PRFX_ID = _id;
  this.lastFire     = 0;
};
Douo.prototype = Object.create(Monster.prototype);
Douo.prototype.constructor = Douo;

Douo.prototype.afterMove = function( dt, world ){
  var x = this.position[0] + this.size[0]/2;
  var xPlayer = world.ship.position[0];
  if( world.timestamp > ( this.lastFire + 1000 ) &&
      xPlayer < x + 0.1 &&
      xPlayer > x - 0.1 ) {
    Sounds.sprites.play('alienRocket');
    Messages.post(
      Messages.ID.ROCKET_LAUNCH,
      Messages.channelIDs.GAME,
      { pos : [ x , this.position[1] ],
        dir : [ 0, 0.001 ],
        isFromBaddies : true });
    this.lastFire = world.timestamp;
  }
};

var Boss = function( position, movePattern, _id ){
  Monster.call( this, {
    position     : position || [ Math.random(), -0.2],
    maxSpeed     : [0.0002, 0.0002],
    speed        : [0, 0.0002],
    size         : [0.08, 0.08],
    weight       : 4,
    life         : 10,
    pattern      : movePattern || "pong",
    value        : 200
  });
  this.PRFX_ID = _id;
  this.lastFire     = 0;
};
Boss.prototype = Object.create(Monster.prototype);
Boss.prototype.constructor = Boss;

Boss.prototype.afterMove = function( dt, world ){
  var x = this.position[0] + this.size[0]/2;
  var xPlayer = world.ship.position[0];
  if( world.timestamp > ( this.lastFire + 1000 ) &&
      xPlayer < x + 0.1 &&
      xPlayer > x - 0.1 ) {
    Sounds.sprites.play('alienRocket');
    Messages.post(
        Messages.ID.ROCKET_LAUNCH,
        Messages.channelIDs.GAME,
        { pos : [ x , this.position[1] ],
          dir : [ 0, 0.001 ],
          isFromBaddies : true });
    this.lastFire = world.timestamp;
  }
};

var Founders = function( position, movePattern, _id ){
  Monster.call( this, {
    position     : position || [ Math.random(), -0.2],
    maxSpeed     : [0.0002, 0.0002],
    speed        : [0, 0.0002],
    size         : [0.12, 0.12],
    weight       : 4,
    life         : 15,
    pattern      : movePattern || "pong",
    value        : 200
  });
  this.PRFX_ID = _id;
  this.lastFire     = 0;
};
Founders.prototype = Object.create(Monster.prototype);
Founders.prototype.constructor = Founders;

Founders.prototype.afterMove = function( dt, world ){
  var x = this.position[0] + this.size[0]/2;
  var xPlayer = world.ship.position[0];
  if( world.timestamp > ( this.lastFire + 1000 ) &&
      xPlayer < x + 0.1 &&
      xPlayer > x - 0.1 ) {
    Sounds.sprites.play('alienRocket');
    Messages.post(
        Messages.ID.ROCKET_LAUNCH,
        Messages.channelIDs.GAME,
        { pos : [ x , this.position[1] ],
          dir : [ 0, 0.001 ],
          isFromBaddies : true });
    this.lastFire = world.timestamp;
  }
};

var Trouo = function( position, movePattern, _id ){
  this.PRFX_ID = _id;
  Monster.call( this, {
    position     : position || [ Math.random(), -0.2],
    maxSpeed     : [0.0002, 0.0002],
    speed        : [0, 0.0002],
    size         : [0.04, 0.04],
    weight       : 0.75,
    life         : 1,
    pattern      : movePattern || "triangle",
    value        : 200

  });

};
Trouo.prototype = Object.create(Monster.prototype);
Trouo.prototype.constructor = Trouo;

var BizzaLove = function( position, movePattern, _id ){
  Monster.call( this, {
    position     : position || [ Math.random(), -0.2],
    maxSpeed     : [0.0001, 0.0001],
    speed        : [0, 0.0001],
    size         : [0.2, 0.2],
    weight       : 4,
    life         : 1,
    pattern      : movePattern || "largeScan",
    value        : 200
  });
  this.PRFX_ID = _id;
};
BizzaLove.prototype = Object.create(Monster.prototype);
BizzaLove.prototype.constructor = BizzaLove;

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

var monsterCatalog = [Zouro,Ouno, Douo, Trouo];
var boss = ['ran', 'boaz', 'alon', 'gai', 'eran', 'tal','founders', 'alex'];

var makeMonster = function makeMonster(monsterId, position, movePattern){
  // var MonsterConstructor= monsterCatalog[monsterId];
  var MonsterConstructor;
  if (boss.includes(monsterId)){
    MonsterConstructor = monsterId === 'founders' ? Founders : Boss;
  }else if(monsterId === 'withlove'){
    MonsterConstructor = BizzaLove;
  }else {
    MonsterConstructor = monsterCatalog[getRandomInt(3)];
  }
  if(!constructor) throw "COME ON PEOPLE! This is not a valid monsterID!";
  else {
    return new MonsterConstructor(position, movePattern , monsterId);
  }
}

module.exports = {
    Zouro: Zouro,
    Ouno: Ouno,
    Douo: Douo,
    Trouo: Trouo,
    Jira: Jira,
    make: makeMonster
};
