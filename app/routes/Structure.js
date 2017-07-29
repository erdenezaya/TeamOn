import React, { Component } from 'react';
import {
  Text,
  View,
  Image,
  Picker,
  Platform,
  ListView,
  TextInput,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Actions } from 'react-native-router-flux';
import Icon from 'react-native-vector-icons/FontAwesome';
import Collapsible from 'react-native-collapsible'
import { Spinner } from '../components/common'
import firebase from '../utils/firebase';

class CollapsibleWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = {
      collapsed: true
    }
  }

  manageCollapse() {
    this.setState({
      collapsed: !this.state.collapsed
    })
  }

  render() {
    const { structure, children } = this.props;
    return (
      <View>
        <TouchableOpacity onPress={this.manageCollapse.bind(this)}>
          <View style={styles.mainStructure}>
            {
              (this.state.collapsed && children)
                ? <Icon name="plus-square-o" size={18} color="#000" />
                : <Icon name="minus-square-o" size={18} color="#000" />
            }
            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-between'}}>
              <Text style={{fontSize: 15, marginLeft: 10}}>{structure}</Text>
              <Icon name="pencil-square-o" size={18} color="#000" style={styles.iconStructure}/>
            </View>
          </View>
          <Collapsible collapsed={this.state.collapsed} style={styles.childStructure}>
            <View>
                {children}
            </View>
          </Collapsible>
        </TouchableOpacity>
      </View>
    )
  }
}

class Structure extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
    }
    this.renderStructures = this.renderStructures.bind(this);
    this.plusIconPressed = this.plusIconPressed.bind(this);
  }

  componentDidMount() {
    ref = firebase.database().ref('structures');
    ref.on('value', this.handleQuery);
  }

  handleQuery = (snapshot) => {
    val = snapshot.val();
    var items = Object.keys(val).map((s, i) => {
      var obj = {id: s, parent: val[s].parent, name: val[s].name};
      return obj;
    });
    items.forEach(e => e.subcats=items.filter(el=>el.parent==e.id));
    items=items.filter(e=>e.parent==0);
    console.log(items);
    this.setState({ loading: false, structures: items });
  }

  plusIconPressed () {
    if (this.props.isAdmin) {
      Actions.newStructure();
    }
  }

  header() {
    const { viewStyle, searchSection, iconLeft, iconList, textInput, textStyle } = styles;
    return (
    <View style={viewStyle}>
      <TouchableOpacity  onPress={() => Actions.contact()} >
        <Icon name="caret-left" size={45} color="#fff" style={iconLeft}/>
      </TouchableOpacity>
      <Text style={textStyle}>Structure</Text>
      <TouchableOpacity onPress={this.plusIconPressed}>
        <Icon name="plus-square-o" size={30} color="#fff" style={iconList} />
      </TouchableOpacity>
    </View>
  )}

  renderStructures(struct) {
    arr = [];
    arr.push(struct);
    return (
      <View style={{paddingLeft: 20}} key={struct.id}>
        <CollapsibleWrapper structure={struct.name} >
          {(struct.subcats && struct.subcats.length) ? struct.subcats.map(this.renderStructures) : null}
        </CollapsibleWrapper>
      </View>
    )
  }

  render() {
    if (this.state.loading) {
      return <Spinner />;
    }
    const { inputStyle } = styles;
    return (
      <View>
        {this.header()}
        {this.state.structures.map(this.renderStructures)}
      </View>
    )
  }

}

const styles = StyleSheet.create({
  mainStructure: {
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#eee',
    padding: 12,
    marginBottom: 3,
    marginLeft: -20,
  },
  childStructure: {
    marginLeft: 10,
    paddingLeft: 10,
  },
  childPlus: {
    color: '#555',
  },
  inputStyle: {
    color: '#555',
    paddingRight: 5,
    paddingLeft: 5,
    fontSize: 16,
    lineHeight: 23,
    height: 50,
    borderWidth: 1,
  },
  viewStyle: {
    backgroundColor: '#6fa8dc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 75,
    paddingTop: (Platform.OS === 'ios') ? 20 : 0,
  },
  textStyle: {
    fontSize: 23,
    color: '#fff'
  },
  iconLeft: {
    marginLeft: 20
  },
  iconList: {
    marginRight: 20,
    width: 30,
    height: 30,
  },
  iconStructure: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
  }
});

export default Structure;