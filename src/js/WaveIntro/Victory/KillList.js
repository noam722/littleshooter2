/** @jsx React.DOM */
var React = require('react/addons');
var _ = require('underscore');

var KillList = React.createClass( {
  render: function(){
    var i = 0;
    var currentWave = this.props.stats.currentWave;
    if (currentWave.kill.withlove){
      return <div></div>;
    }
    var killList    = _.map(currentWave.kill, function(timestamps, monsterType){
      var monsterClass = "monster "+monsterType;
      const offset = i%2==0?1:0;
      console.log(offset);
      return <div key={monsterType} className={ "col-xs-offset-"+offset+ " col-xs-5  "+this.props.className + " delay-" + ++i}>
        <span className={monsterClass}/> x {timestamps.length}
      </div>
    }, this);
    var perfectText = _.isEmpty(currentWave.miss) ?
      <div className={"perfect impact delay-"+ (i+1) }>Perfect</div> : undefined;
    return <div className="kill-list">
      <h2 className={this.props.className + ' victory-description'}>{this.props.title}</h2>
      <div className={'row justify-content-center'}>
        {killList}
      </div>
      {perfectText}
    </div>;
  }
} );

module.exports = KillList;
