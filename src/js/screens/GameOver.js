/** @jsx React.DOM */

var React = require('react/addons');
var Messages = require('../Messages.js');
var Sounds = require('../Sounds');

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
      <audio id="sound_thanks" hidden={true}>
        <source src={`assets/music/leemore-thank-you1553454062.mp3`} type="audio/mpeg" />
      </audio>
    </div>;
  },
  componentWillReceiveProps:function(next){
    Sounds.createNewHowl(100);
    if (!(this.state && this.state.played)){
      document.getElementById('sound_thanks').play();
      this.setState({
        ...state,
        played: true
      })
    }
    if(next.inputState.keys.enter) Messages.post(Messages.ID.CHANGE_SCREEN, Messages.channelIDs.ROOT);
  }
});

module.exports = GameOver;
