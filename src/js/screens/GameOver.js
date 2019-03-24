/** @jsx React.DOM */

var React = require('react/addons');
var Messages = require('../Messages.js');

var GameOver = React.createClass({
  render:function(){
    var world = this.props.lastScreenData;
    return <div className="intro">
      <h1 >Game over</h1>
      <div style={{marginLeft:'25px', marginRight:'25px', marginTop:'20px' }}>
      <p className="from-left level-description delay-1" >Limor, thank you for everything</p>
      <p className="from-left level-instructions delay-2" >Good Luck with your next Adventure!</p>
      </div>
      <div className={'withlove fade-in delay-3'} />
      <p className={'from-left delay-4'}>Score : {world.player.score}</p>
      <p className={'from-left delay-4'}>Rank : #1</p>
      <h2 className={'blink-slow'} style={{ marginTop:'20px' }}>
      New Game <span className="button">return</span>
      </h2>
    </div>;
  },
  componentWillReceiveProps:function(next){
    if(next.inputState.keys.enter) Messages.post(Messages.ID.CHANGE_SCREEN, Messages.channelIDs.ROOT);
  }
});

module.exports = GameOver;
