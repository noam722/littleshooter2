/** @jsx React.DOM */
var React = require('react/addons');
var _ = require('underscore');

var KillList = require('./KillList');
var Score = require('./Score');

var Victory = React.createClass({
  render : function(){
    if( this.props.score > 0 ){
      return <div className="wave-intro intro">
          <h1 className="impact">{this.props.title}{this.props.newVP ?<img src={'assets/'+this.props.newVP+'.png'} style={{maxWidth: '80px', maxHeight: '80px'}}/>: ''}  </h1>
          <KillList className="from-left" stats={this.props.stats} title={this.props.description}/>
          <Score className="fade-in" score={ this.props.score } />
          <p className="fade-in-then-blink">
            Press <span className="button">enter</span>
          </p>
          <audio id="sound_victory" hidden>
              <source src={`assets/music/${this.props.sounds.victory}`} type="audio/mpeg" />
          </audio>
        </div>;
    }
    else {
      return <div className="wave-intro intro">
          <h1 className="impact">{this.props.title}</h1>
          <KillList className="from-left" stats={this.props.stats} title={this.props.description}/>
          <p className="fade-in-then-blink">
            Press <span className="button">enter</span>
          </p>
          <audio id="sound_victory">
              <source src={`assets/music/${this.props.sounds.victory}`} type="audio/mpeg" />
          </audio>
        </div>;
    }
  }
});

module.exports = Victory;
