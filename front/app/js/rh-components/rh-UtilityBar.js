import React from 'react';

class UtilityBar extends React.Component {

  constructor() {
    super();
    this.state = {};
  }

  componentDidMount() {}

  render() {
    let welcome = this.props.welcome ? (<p className="user"><i className="fa fa-user"/> Welcome,&nbsp; <strong>{this.props.username}!</strong></p>) : null;
    return (<div className="rh-utilitybar">
      {welcome}
      {this.renderLinks()}
    </div>);
  }

  renderLinks() {
    if(!this.props.links) {
      return (<div/>)
    }

    return (<ul className="links">
      {
        this.props.links.map((item, i) => {
          return (<li key={i}><a href={item.link} target='_blank'>{item.label}</a></li>);
        })
      }
    </ul>)
  }

}

UtilityBar.defaultProps = {
  username: null
};
UtilityBar.propTypes = {
  label: React.PropTypes.string,
  links: React.PropTypes.array,
  username: React.PropTypes.string
};

export default UtilityBar;