import React, { Component } from 'react';
import { Actions } from 'react-native-router-flux';
import { 
  View,
  Text,
  Image,
  Picker,
  Linking,
  Platform,
  ListView,
  TextInput,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  TouchableHighlight,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import DatePicker from 'react-native-datepicker'
import Modal from 'react-native-modal';
import Communications from 'react-native-communications';
import RNFetchBlob from 'react-native-fetch-blob';
import ImagePicker from 'react-native-image-picker';
import Uploader from '../../components/Uploader';
import { Header, Spinner, FloatButton, EditButton, Input, CardSection, Card } from '../../components/common';
import images from '../../config/images';
import firebase from '../../utils/firebase';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

Height = Dimensions.get("window").height
Width = Dimensions.get("window").width

class ModalWrapper extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { title, icon, isVisible, onChangeText, value, onSave, onHide, onDelete, children } = this.props;
    const { modal, modalTitle, btnContainer, btn, btntextStyle } = styles;
    return (
      <Modal isVisible={isVisible}>
        <View style={modal}>
          <Text style={modalTitle}>{title}</Text>
          {children}
          <View style={btnContainer}>
            {
              onSave
                ? <TouchableOpacity style={btn} onPress={onSave}>
                    <Text style={btntextStyle}>Save</Text>
                  </TouchableOpacity> 
                : null
            }
            {
              onDelete
                ? <TouchableOpacity style={[btn, {backgroundColor: '#F44336', borderColor: 'red'}]} onPress={onDelete}>
                    <Text style={btntextStyle}>Delete</Text>
                  </TouchableOpacity> 
                : null
            }
            <TouchableOpacity style={btn} onPress={onHide}>
              <Text style={btntextStyle}>Cancel</Text>
            </TouchableOpacity> 
          </View>
        </View>
      </Modal>
    );
  }
}

class ModalWrapperClose extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { isVisible, onClose, children } = this.props;
    const { modal, btnContainer, btn, btntextStyle } = styles;
    return (
      <Modal isVisible={isVisible}>
        <View style={modal}>
          {children}
          <View style={btnContainer}>
            <TouchableOpacity style={btn} onPress={onClose}>
              <Text style={btntextStyle}>Close</Text>
            </TouchableOpacity> 
          </View>
        </View>
      </Modal>
    );
  }
}

const Blob = RNFetchBlob.polyfill.Blob
const fs = RNFetchBlob.fs
window.XMLHttpRequest = RNFetchBlob.polyfill.XMLHttpRequest
window.Blob = Blob

const  uploadImage = (uri, mime, uid) => {
    return new Promise((resolve, reject) => {
      const uploadUri = Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
      let uploadBlob = null

      const imageRef = firebase.storage().ref('profileImg').child(uid)
      fs.readFile(uploadUri, 'base64')
        .then((data) => {
          return Blob.build(data, { type: `${mime};BASE64` })
        })
        .then((blob) => {
          uploadBlob = blob
          return imageRef.put(uploadUri, { contentType: mime })
        })
        .then(() => {
          uploadBlob.close()
          return imageRef.getDownloadURL()
        })
        .then((url) => {
          console.log(resolve(url))
          resolve(url)
        })
        .catch((error) => {
          reject(error)
      })
    })
  }

class Contact extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user       : null,
      info       : null,
      loadingUser: true,
      loadingInfo: true,
      currentUid : firebase.auth().currentUser.uid,
      uid        : '',
      password   : '',
      familyError: '',
    };
      
    this.renderContent = this.renderContent.bind(this);
  }
    state = {
      isSocialVisible      : false,
      isContactVisible     : false,
      isAnniversaryVisible : false,
      isFamilyVisible      : false,
      isFavouriteVisible   : false,
      isInterestVisible    : false,
      isMoreVisible        : false,
      isNicknameVisible    : false,
      isGenderVisible      : false,
      isPasswordVisible    : false,
      isProfileImageVisible: false,
      isBigImage           : false,
      isFamilyMemberVisible: false,
      isEditFamilyVisible  : false,
    }

  componentWillMount() {
   try {
      this.setState({
        uid: this.state.currentUid
      })
    } catch(error){
      console.log(error)
    }
  }


  componentDidMount() {
    userRef = firebase.database().ref(`/users/${this.props.uid}`);
    userRef.on('value', this.handleUser);

    infoRef = firebase.database().ref(`/userInfo/${this.props.uid}`);
    infoRef.on('value', this.handleInfo);
  }

  handleUser = (snapshot) => {
    val = snapshot.val() || {};
    user = val;
    this.setState({
      user,
      loadingUser: false,
      firstName  : user.firstName,
      lastname   : user.lastname,
      email      : user.email,
      phone      : user.phone,
      birthday   : user.anniversary.birthday,
      firstDay   : user.anniversary.firstDay
    });

    ref = firebase.database().ref(`/structures/${user.structure}`);
    ref.on('value', this.handleStructure);
  }

  handleStructure = (snapshot) => {
    val = snapshot.val() || {};
    this.setState({
      structure: val.name
    });
  }

  handleInfo = (snapshot) => {
    val = snapshot.val() || {};
    info = val;

    listView   = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
    drink      = '';
    food       = '';
    snack      = '';
    music      = '';
    sport      = '';
    members    = [];

    facebook  = ''
    twitter   = ''
    instagram = ''
    linkedin  = ''
    skype     = ''

    if (info.favourite) {
      drink = info.favourite.drink;
      food  = info.favourite.food;
      snack = info.favourite.snack;
      music = info.favourite.music;
      sport = info.favourite.sport;
    }
    if (info.social) {
      facebook  = info.social.facebook;
      twitter   = info.social.twitter;
      instagram = info.social.instagram;
      linkedin  = info.social.linkedin;
      skype     = info.social.skype;
    }
    if (info.family) {
      members = Object.keys(info.family).map(function (key) {
        info.family[key].key = key;
        return info.family[key];
      });
    }
    this.setState({
      info,
      drink,
      food,
      snack,
      music,
      sport,
      facebook,
      twitter,
      instagram,
      linkedin,
      skype,
      memberList : listView.cloneWithRows(members),
      loadingInfo: false,
      nickname   : info.nickname,
      gender     : info.gender,
      more       : info.info,

    });
  }

  header() {
    const { viewStyle, iconLeft, iconList, textStyle } = styles;
    return (
    <View style={viewStyle}>
      <TouchableOpacity onPress={() => Actions.pop()} style={styles.headBtn}>
        <Icon name="caret-left" size={45} color="#fff" style={iconLeft} />
      </TouchableOpacity>
      <Text style={textStyle}>Profile</Text>
      {
        this.props.currentUser === true
          ? (<TouchableOpacity onPress={() => this.setState({ isPasswordVisible: true })} style={styles.headBtn}>
              <Icon name="lock" size={30} color="#fff" style={iconList} />
            </TouchableOpacity>)
          : <View style={{width: 80}}/>
      }
    </View>
  )}

  savePassword(){
    if (this.state.password.length === 0) {
      this.setState({ passwordErr: 'Password should not be null.' });
      return;
    }
    if (this.state.password !== this.state.newPassword) {
      this.setState({ passwordErr: 'Password does not match.' });
      return;
    }
    let user = firebase.auth().currentUser;
    user.updatePassword(this.state.password)
      .then(() => {
        this.setState({ isPasswordVisible: false, newPassword: '', password: '', passwordErr: '' })
      })
      .catch((err) => {
        this.setState({
          newPassword: '',
          password: '',
          passwordErr: 'This operation is sensitive and requires recent authentication. Log in again before changing password.'
        })
      });
  }

  saveFamilyMember() {
    if (!this.state.newMemberName || !this.state.newMemberRelation || !this.state.newMemberBirthday) {
      this.setState({ familyError: 'Name, relation and birthday must be filled.' });
      return;
    }
    firebase.database().ref(`/userInfo/${this.props.uid}/family`)
    .push({
      name: this.state.newMemberName,
      relation: this.state.newMemberRelation,
      birthday: this.state.newMemberBirthday,
      phone: this.state.newMemberNumber
    })
    .then(() => this.setState({
      isFamilyMemberVisible: false,
      newMemberName: '',
      newMemberRelation: '',
      newMemberBirthday: '',
      newMemberNumber: ''
    }));
  }

  updateFamilyMember() {
    if (!this.state.newMemberName || !this.state.newMemberRelation || !this.state.newMemberBirthday) {
      this.setState({ familyError: 'Name, relation and birthday must be filled.' });
      return;
    }
    firebase.database().ref(`/userInfo/${this.props.uid}/family/${this.state.editMemberKey}`)
    .update({
      name: this.state.newMemberName,
      relation: this.state.newMemberRelation,
      birthday: this.state.newMemberBirthday,
      phone: this.state.newMemberNumber
    })
    .then(() => this.setState({ 
      isEditFamilyVisible: false,
      newMemberName: '',
      newMemberRelation: '',
      newMemberBirthday: '',
      newMemberNumber: ''
    }));
  }

  removeFamilyMember() {
    firebase.database().ref(`/userInfo/${this.props.uid}/family/${this.state.editMemberKey}`)
      .remove()
      .then(() => this.setState({ 
        isEditFamilyVisible: false,
        newMemberName: '',
        newMemberRelation: '',
        newMemberBirthday: '',
        newMemberNumber: ''
      }));
  }

  saveNickName(){
    firebase.database().ref(`/userInfo/${this.props.uid}/`)
    .update({ 
      nickname: this.state.nickname
    })
    .then(() => { this.setState({ isNicknameVisible: false })
    });
  }

  saveProfileImage(){
    try {
      uploadImage(this.state.imagePath, 'image/jpeg', `${this.props.uid}.jpg`)
       .then((responseData) => {
         firebase.database().ref(`users/${this.props.uid}`)
          .update({
            profileImg: responseData
          })
       })
       .done(() => { 
        this.setState({ isProfileImageVisible: false });
       })
    } catch(error){
    }
  }

  saveGender(){
    firebase.database().ref(`/userInfo/${this.props.uid}/`)
    .update({ 
      gender: this.state.gender
     })
    .then(() => { this.setState({ isGenderVisible: false })
    });
  }

  saveAnniversary() {
    firebase.database().ref(`/users/${this.props.uid}/`)
    .update({
      anniversary: {
        birthday: this.state.birthday,
        firstDay: this.state.firstDay
      }
    })
    .then(() => { this.setState({ isAnniversaryVisible: false })
    });
  }

  saveSocialAccount() {
    firebase.database().ref(`/userInfo/${this.props.uid}/`)
    .update({
      social: {
        facebook : this.state.facebook,
        twitter  : this.state.twitter,
        instagram: this.state.instagram,
        linkedin : this.state.linkedin,
        skype    : this.state.skype
      }
    })
    .then(() => { this.setState({ isSocialVisible: false })
    });
  }

  saveMoreInfo() {
    firebase.database().ref(`/userInfo/${this.props.uid}/`)
    .update({
      info: this.state.more
    })
    .then(() => { this.setState({ isMoreVisible: false })
    });
  }

  saveInterest() {
    firebase.database().ref(`/userInfo/${this.props.uid}/`)
    .update({
      interest: this.state.interest
    })
    .then(() => { this.setState({ isInterestVisible: false })
    });
  }

  saveFavourites() {
    firebase.database().ref(`/userInfo/${this.props.uid}/`)
    .update({
      favourite: {
        drink: this.state.drink,
        food : this.state.food,
        snack: this.state.snack,
        music: this.state.music,
        sport: this.state.sport,
      }
    })
    .then(() => { this.setState({ isFavouriteVisible: false })
    });
  }

  OnPhonePress(){
    const { phone, firstName } = this.state.user;

    Communications.phonecall(phone.toString(), false)
  }

  OnTextPress(){
    const { phone, firstName } = this.state.user;

    Communications.text(phone.toString(), '')
  }

  OnEmailPress(){
    const { email } = this.state.user;

    Communications.email([email.toString(),],null,null,'','')
  }

  renderSocialIcons(userProp, infoProp) {
    return (
      <View style={{flexDirection: 'row', paddingBottom: 20, paddingTop: 10, justifyContent: 'center'}}>
      {
       (infoProp.social && infoProp.social.facebook) ?
        <TouchableOpacity onPress={() => Linking.openURL(`https://www.facebook.com/${infoProp.social.facebook}`)}>
          <Image source={images.fb} style={styles.socialImage} />
        </TouchableOpacity> : null 
      }
      {
      (infoProp.social && infoProp.social.twitter) ?
        <TouchableOpacity onPress={() => Linking.openURL(`https://www.twitter.com/${infoProp.social.twitter}`)}>
          <Image source={images.twitter} style={styles.socialImage} />
        </TouchableOpacity> : null      
      }
      {
        (infoProp.social && infoProp.social.instagram) ?
        <TouchableOpacity onPress={() => Linking.openURL(`https://www.instagram.com/${infoProp.social.instagram}`)}>
          <Image source={images.instagram} style={styles.socialImage} />
        </TouchableOpacity> : null
      }
      {
       (infoProp.social && infoProp.social.linkedin) ?
        <TouchableOpacity onPress={() => Linking.openURL(`https://www.linkedin.com/${infoProp.social.linkedin}`)}>
          <Image source={images.linkedin} style={styles.socialImage} />
        </TouchableOpacity> : null
      }
      {
        (infoProp.social && infoProp.social.skype) ?
        <TouchableOpacity onPress={() => Linking.openURL(`https://www.skype.com/${infoProp.social.skype}`)}>
          <Image source={images.skype} style={styles.socialImage} />
        </TouchableOpacity> : null
      }
      </View>
  )}

  renderFamilyMember(rowData) {
    return (
      <TouchableOpacity onPress={() => this.setState({
        isEditFamilyVisible: true,
        newMemberBirthday: rowData.birthday,
        newMemberName: rowData.name,
        newMemberRelation: rowData.relation,
        newMemberNumber: rowData.phone,
        editMemberKey: rowData.key
      })}>
        <CardSection style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: '#000' }}>{rowData.name}</Text>
            <Text style={{ color: '#aaa' }}>{rowData.relation}</Text>
          </View>
          <View>
            <Text style={{ color: '#000', textAlign: 'right' }}>{rowData.phone}</Text>
            <Text style={{ color: '#aaa' }}>{rowData.birthday}</Text>
          </View>
        </CardSection>
      </TouchableOpacity>
    )
  }

  renderWrappers() {
    return (
      <View>
        <ModalWrapper
          isVisible={this.state.isPasswordVisible}
          title="Password"
          onSave={this.savePassword.bind(this)}
          onHide={() => this.setState({ isPasswordVisible: false, password: '', newPassword: '' })}>
          <Card>
            <CardSection>
              <Input
                icon        ="md-lock"
                placeholder ="New password"
                onChangeText={(password) => this.setState({ password })}
                value       ={this.state.twitter}
                secureTextEntry />
            </CardSection>
            <CardSection>
              <Input
                icon        ="md-lock"
                placeholder ="Repeat new password"
                onChangeText={(newPassword) => this.setState({ newPassword })}
                value       ={this.state.twitter}
                secureTextEntry />
            </CardSection>
            <Text style={styles.errorText}>{this.state.passwordErr}</Text>
          </Card>
        </ModalWrapper>

        <ModalWrapper
          isVisible={this.state.isNicknameVisible}
          title="Nickname"
          onSave={this.saveNickName.bind(this)}
          onHide={() => this.setState({ isNicknameVisible: false, nickname: this.state.info.nickname })}>
          <Card>
            <CardSection>
              <Input
                icon          ='ios-contact'
                placeholder   ="Nickname"
                onChangeText  ={(nickname) => this.setState({nickname})}
                value         ={this.state.nickname}
                autoCapitalize='words' />
            </CardSection>
          </Card>
        </ModalWrapper>

        <ModalWrapperClose
          isVisible={this.state.isBigImage}
          onClose={() => this.setState({ isBigImage: false })}>
          {
            this.state.user.profileImg
              ? <Image source={{uri: this.state.user.profileImg}} style={styles.bigImage} />
              : <Image source={images.avatar} style={styles.bigAccImage} />
          }
        </ModalWrapperClose>

        <ModalWrapper
          isVisible={this.state.isGenderVisible}
          title="Gender"
          onSave={this.saveGender.bind(this)}
          onHide={() => this.setState({ isGenderVisible: false, gender: this.state.info.gender })}>
          <Picker
            selectedValue={this.state.gender}
            onValueChange={(gender) => this.setState({gender})}>
            <Picker.Item label="Male" value="male" />
            <Picker.Item label="Female" value="female" />
          </Picker>
        </ModalWrapper>

        <ModalWrapper
          isVisible={this.state.isProfileImageVisible}
          title="Profile Image"
          onSave={this.saveProfileImage.bind(this)}
          onHide={() => this.setState({ isProfileImageVisible: false, profileImg: '' })}>
            <TouchableOpacity onPress={() => this.openPicker()} style={styles.ProfileImageContainer}>
            {
            this.state.imagePath ? <Image style={styles.profileImageDetail} source={{uri: this.state.imagePath}} value={this.state.imagePath} onChangeImage={(profileImg) => this.setState({profileImg})} /> :
              <View style={styles.ProfileImageContainer}>
                <Text style={styles.profileImageText}>Энд</Text> 
                <Text>дарж зурагаа оруулна уу</Text>
              </View>
            }
            </TouchableOpacity>
        </ModalWrapper>

        <ModalWrapper
          isVisible={this.state.isSocialVisible}
          title="Social accounts"
          onSave={this.saveSocialAccount.bind(this)}
          onHide={() => this.setState({ isSocialVisible: false, facebook: '', twitter: '', instagram: '', linkedin: '', skype: '' })} >
          <Card>
            <CardSection>
              <Input
                icon          ="logo-facebook"
                placeholder   ="Facebook"
                onChangeText  ={(facebook) => this.setState({facebook})}
                value         ={this.state.facebook}
                autoCapitalize='none' />
            </CardSection>
            <CardSection>
              <Input
                icon          ="logo-twitter"
                placeholder   ="Twitter"
                onChangeText  ={(twitter) => this.setState({twitter})}
                value         ={this.state.twitter}
                autoCapitalize='none' />
            </CardSection>
            <CardSection>
              <Input
                icon          ="logo-instagram"
                placeholder   ="Instagram"
                onChangeText  ={(instagram) => this.setState({instagram})}
                value         ={this.state.instagram}
                autoCapitalize='none'  />
            </CardSection>
            <CardSection>
              <Input
                icon          ="logo-linkedin"
                placeholder   ="Linkedin"
                onChangeText  ={(linkedin) => this.setState({linkedin})}
                value         ={this.state.linkedin}
                autoCapitalize='none'  />
            </CardSection>
            <CardSection>
              <Input
                icon          ="logo-skype"
                placeholder   ="Skype"
                onChangeText  ={(skype) => this.setState({skype})}
                value         ={this.state.skype}
                autoCapitalize='none'  />
            </CardSection>
          </Card>
        </ModalWrapper>

        <ModalWrapper
          isVisible={this.state.isAnniversaryVisible}
          title="Anniversary"
          onSave={this.saveAnniversary.bind(this)}
          onHide={() => this.setState({ isAnniversaryVisible: false, birthday: this.state.user.anniversary.birthday, firstDay: this.state.user.anniversary.firstDay })} >
          <Card>
            <CardSection>
              <Icon style={styles.iconStyle} name="birthday-cake" size={23} color="#98bce1"/>
              <DatePicker
                style         ={styles.datePicker}
                value         ={this.state.birthday}
                date          ={this.state.birthday}
                mode          ="date"
                placeholder   ="Birthday"
                format        ="YYYY-MM-DD"
                confirmBtnText="Yes"
                cancelBtnText ="No"
                onDateChange  ={(birthday) => this.setState({birthday})}
              />
            </CardSection>
            <CardSection>
              <Icon style={styles.iconStyle} name="briefcase" size={23} color="#98bce1"/>
              <DatePicker
                style         ={styles.datePicker}
                value         ={this.state.firstDay}
                date          ={this.state.firstDay}
                mode          ="date"
                placeholder   ="Work anniversary"
                format        ="YYYY-MM-DD"
                confirmBtnText="Yes"
                cancelBtnText ="No"
                onDateChange  ={(firstDay) => this.setState({firstDay})}
              />
            </CardSection>
          </Card>
        </ModalWrapper>

        <ModalWrapper
          isVisible={this.state.isFamilyVisible}
          title="Family"
          onHide={() => this.setState({ isFamilyVisible: false })} >
          <Card>
            <ListView 
              dataSource = {this.state.memberList}
              renderRow = {(rowData) => this.renderFamilyMember(rowData)}
              enableEmptySections = {true}
            />
            <CardSection style={{ alignSelf: 'flex-end'}}>
              <TouchableOpacity onPress={() => this.setState({ isFamilyMemberVisible: true })}>
                <Text>Add Family Member</Text>
              </TouchableOpacity>
            </CardSection>
          </Card>
         
          <ModalWrapper
            isVisible={this.state.isFamilyMemberVisible}
            title="Family Member"
            onSave={this.saveFamilyMember.bind(this)}
            onHide={() => this.setState({
              isFamilyMemberVisible: false,
              newMemberName: '',
              newMemberBirthday: '',
              newMemberRelation: '',
              newMemberNumber: '',
              familyError: '',
            })}>
            <Card>
              <CardSection>
                <Input
                  icon         ='ios-contact'
                  placeholder  ="FirstName"
                  style        ={styles.inputStyle}
                  onChangeText ={(name) => this.setState({ newMemberName: name })}
                  value        ={this.state.newMemberName}
                />
              </CardSection>
              <CardSection>
                <Input
                  icon         ='ios-contacts'
                  placeholder  ="Relation"
                  style        ={styles.inputStyle}
                  onChangeText ={(relation) => this.setState({ newMemberRelation: relation })}
                  value        ={this.state.newMemberRelation}
                />
              </CardSection>
              <CardSection>
                <Icon style={styles.iconStyle} name="birthday-cake" size={23} color="#98bce1"/>
                <DatePicker
                  style         ={styles.datePicker}
                  value         ={this.state.newMemberBirthday}
                  date          ={this.state.newMemberBirthday}
                  mode          ="date"
                  placeholder   ="Birthday"
                  format        ="YYYY-MM-DD"
                  confirmBtnText="Yes"
                  cancelBtnText ="No"
                  onDateChange  ={(birthday) => this.setState({ newMemberBirthday: birthday })}
                />
              </CardSection>
              <CardSection>
                <Input
                  icon         ='ios-call'
                  placeholder  ="Phone"
                  style        ={styles.inputStyle}
                  onChangeText ={(number) => this.setState({ newMemberNumber: number })}
                  value        ={this.state.newMemberNumber}
                />
              </CardSection>
              <Text style={styles.errorText}>{this.state.familyError}</Text>
            </Card>
          </ModalWrapper>

          <ModalWrapper
            isVisible ={this.state.isEditFamilyVisible}
            title     ="Edit Family Member"
            onSave    ={this.updateFamilyMember.bind(this)}
            onDelete  ={this.removeFamilyMember.bind(this)}
            onHide    ={() => this.setState({
              isEditFamilyVisible: false,
              newMemberName      : '',
              newMemberBirthday  : '',
              newMemberRelation  : '',
              newMemberNumber    : '',
              familyError        : '',
            })}>
            <Card>
              <CardSection>
                <Input
                  icon         ='ios-contact'
                  placeholder  ="FirstName"
                  style        ={styles.inputStyle}
                  onChangeText ={(name) => this.setState({ newMemberName: name })}
                  value        ={this.state.newMemberName}
                />
              </CardSection>
              <CardSection>
                <Input
                  icon         ='ios-contacts'
                  placeholder  ="Relation"
                  style        ={styles.inputStyle}
                  onChangeText ={(relation) => this.setState({ newMemberRelation: relation })}
                  value        ={this.state.newMemberRelation}
                />
              </CardSection>
              <CardSection>
                <Icon style={styles.iconStyle} name="birthday-cake" size={23} color="#98bce1"/>
                <DatePicker
                  style         ={styles.datePicker}
                  value         ={this.state.newMemberBirthday}
                  date          ={this.state.newMemberBirthday}
                  mode          ="date"
                  placeholder   ="Birthday"
                  format        ="YYYY-MM-DD"
                  confirmBtnText="Yes"
                  cancelBtnText ="No"
                  onDateChange  ={(birthday) => this.setState({ newMemberBirthday: birthday })}
                />
              </CardSection>
              <CardSection>
                <Input
                  icon         ='ios-call'
                  placeholder  ="Phone"
                  style        ={styles.inputStyle}
                  onChangeText ={(number) => this.setState({ newMemberNumber: number })}
                  value        ={this.state.newMemberNumber}
                />
              </CardSection>
              <Text style={styles.errorText}>{this.state.familyError}</Text>
            </Card>
          </ModalWrapper>
        </ModalWrapper>

        <ModalWrapper
          isVisible={this.state.isMoreVisible}
          title="More Information"
          onSave={this.saveMoreInfo.bind(this)}
          onHide={() => this.setState({ isMoreVisible: false, more: this.state.info.info })}>
          <Card>
            <CardSection>
              <TextInput
                placeholder  ="More information about you..."
                onChangeText ={(more) => this.setState({more})}
                value        ={this.state.more}
                style        ={styles.textInputLong}
                multiline    = {true}
                numberOfLines= {4}
                autoCorrect  = {false}
              />
            </CardSection>
          </Card>
        </ModalWrapper>

        <ModalWrapper
          isVisible={this.state.isInterestVisible}
          title="Interest"
          onSave={this.saveInterest.bind(this)}
          onHide={() => this.setState({ isInterestVisible: false, interest: this.state.info.interest })}>
          <Card>
            <CardSection>
              <TextInput
                placeholder  ="Write about your hobby..."
                onChangeText ={(interest) => this.setState({interest})}
                value        ={this.state.interest}
                style        ={styles.textInputLong}
                multiline    = {true}
                numberOfLines= {4}
                autoCorrect  = {false}
              />
            </CardSection>
          </Card>
        </ModalWrapper>

        <ModalWrapper
          isVisible={this.state.isFavouriteVisible}
          title="Favourite things"
          onSave={this.saveFavourites.bind(this)}
          onHide={() =>
            this.setState({
              isFavouriteVisible: false,
              drink: this.state.info.favourite.drink,
              food : this.state.info.favourite.food,
              snack: this.state.info.favourite.snack,
              music: this.state.info.favourite.music,
              sport: this.state.info.favourite.sport
            })}>
          <KeyboardAwareScrollView
            behavior="padding"
          >
          <Card>
            <CardSection>
              <Input
                icon          ="ios-beer"
                placeholder   ="Drinks"
                onChangeText  ={(drink) => this.setState({drink})}
                value         ={this.state.drink}
                autoCapitalize='none' />
            </CardSection>
            <CardSection>
              <Input
                icon          ="ios-pizza"
                placeholder   ="Foods"
                onChangeText  ={(food) => this.setState({food})}
                value         ={this.state.food}
                autoCapitalize='none' />
            </CardSection>
            <CardSection>
              <Input
                icon          ="logo-apple"
                placeholder   ="Snacks"
                onChangeText  ={(snack) => this.setState({snack})}
                value         ={this.state.snack}
                autoCapitalize='none' />
            </CardSection>
            <CardSection>
              <Input
                icon          ="ios-headset"
                placeholder   ="Music"
                onChangeText  ={(music) => this.setState({music})}
                value         ={this.state.music}
                autoCapitalize='none' />
            </CardSection>
            <CardSection>
              <Input
                icon          ="ios-basketball"
                placeholder   ="Sport"
                onChangeText  ={(sport) => this.setState({sport})}
                value         ={this.state.sport}
                autoCapitalize='none' />
            </CardSection>
          </Card>
          </KeyboardAwareScrollView>
        </ModalWrapper>

        {/*
        */}
      </View>
    );
  }

  renderEditIcon() {
    <Icon name="pencil-square-o" size={23} color="#000" style={styles.icon} onPress={() => this.setState({ isNicknameVisible: true })}/>
  }

  openPicker(){
      const options = {
        title: 'Зурагаа сонгоно уу',
        storageOptions: {
          skipBackup: true,
          path: 'profileImg'
        }
      }
      ImagePicker.showImagePicker(options, (response) => {
        if(response.didCancel){
          console.log('User canccelled')
        } else if (response.error){
          console.log('Error' + response.error)
        } else if(response.customButton){
          console.log('custom'+ response.customButton)
        } else {
            this.setState({
              imagePath: response.uri,
              imageHeight: response.height,
              imageWidth: response.width
            })
        }
      })
  }

  renderMembersOnProfile(rowData) {
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, marginRight: 30 }}>
        <View>
          <Text style={{ color: '#000' }}>{rowData.name}</Text>
          <Text style={{ color: '#aaa' }}>{rowData.relation}</Text>
        </View>
        <View>
          <Text style={{ color: '#000', textAlign: 'right' }}>{rowData.phone}</Text>
          <Text style={{ color: '#aaa' }}>{rowData.birthday}</Text>
        </View>
      </View>
    )
  }

  renderContent() {
    if (this.state.loadingUser || this.state.loadingInfo) {
      return (
          <Spinner style={{ marginTop: 200 }}/>
        )
    }

    const userProp = this.state.user;
    const infoProp = this.state.info; 
    return (
      <ScrollView >
        <View style={styles.mainStyle}>
          { 
            ( this.props.currentUser)
              ? <TouchableOpacity onPress={() => this.setState({ isProfileImageVisible: true })}>
                  { userProp.profileImg ?  <Image source={{uri: userProp.profileImg}} style={styles.profileImage} /> :
                    <Image source={images.avatarAdd} style={styles.profileImage} />
                  } 
                </TouchableOpacity>
              : <TouchableOpacity onPress={() => this.setState({ isBigImage: true })}>
                  { userProp.profileImg ?  <Image source={{uri: userProp.profileImg}} style={styles.profileImage} /> :
                    <Image source={images.avatar} style={styles.profileImage} />
                  } 
                </TouchableOpacity> 
         }
          <View style={styles.namePart}>
            <View style={styles.nameFlex}>
              <Text style={styles.generalText}>Name:</Text>
              <Text style={styles.userName}>{userProp.firstName} {userProp.lastname}</Text>
            </View>
            <View style={styles.nameFlex}>
              <Text style={styles.generalText}>Position:</Text>
              <Text style={styles.position}>{userProp.position}</Text>
            </View>
            <View style={styles.nameFlex}>
              <Text style={styles.generalText}>Department:</Text>
              <Text style={styles.department}>{this.state.structure}</Text>
            </View>
            <View style={styles.nameFlex}>
              <Text style={styles.generalText}>Nickname:</Text>
              <View style={styles.mainTitle}>
                {
                  infoProp.nickname
                    ? <Text>{infoProp.nickname}</Text>
                    : null
                }
                {
                  ( this.props.currentUser)
                    ? <Icon name="pencil-square-o" size={23} color="#000" style={styles.icon} onPress={() => this.setState({ isNicknameVisible: true })}/>
                    : null
                }
              </View>
            </View>
            <View style={styles.nameFlex}>
              <Text style={styles.generalText}>Gender:</Text>
              <View style={styles.mainTitle}>
                {
                  infoProp.gender
                    ? <Text>{infoProp.gender}</Text>
                    : null
                }
                {
                  ( this.props.currentUser)
                    ? <Icon name="pencil-square-o" size={23} color="#000" style={styles.icon} onPress={() => this.setState({ isGenderVisible: true })}/>
                    : null
                }
              </View>
            </View>
          </View>
        </View>

        { 
          userProp.phone
            ? <View style={styles.mainStyle}>
                <View style={styles.center}>
                  <TouchableOpacity onPress={this.OnPhonePress.bind(this)}>
                    <Icon name="phone-square" size={42} color="#009e11" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={this.OnTextPress.bind(this)}>
                    <Icon name="envelope" size={42} color="#b45f00" style={{margin: 15}} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={this.OnEmailPress.bind(this)}>
                    <Icon name="paper-plane" size={36} color="#2196f3" />
                  </TouchableOpacity>
                </View>
              </View>
            : null
        }

        <View style={styles.columnStyle}>
          <View style={styles.mainTitle}>
            <Text style={styles.mainTitleText}>Social accounts</Text>
            {
              ( this.props.currentUser)
                ? <Icon name="pencil-square-o" size={23} color="#000" style={styles.icon} onPress={() => this.setState({ isSocialVisible: true })}/>
                : null
            }
          </View>
          {this.renderSocialIcons(userProp, infoProp)}

          <View style={styles.mainTitle}>
            <Text style={styles.mainTitleText}>Anniversary</Text>
            {
              ( this.props.currentUser)
                ? <Icon name="pencil-square-o" size={23} color="#000" style={styles.icon} onPress={() => this.setState({ isAnniversaryVisible: true })}/>
                : null
            }
            
          </View>
          <View style={styles.mainContent}>
          {
              userProp.anniversary.birthday
                ? <View style={styles.mainContainerStyle}>
                    <Icon style={styles.contentIconStyle} name="birthday-cake" size={14} color="#333"/>
                    <Text style={styles.contentIconStyle}>{userProp.anniversary.birthday}</Text>
                  </View>
                : null
          }
          {
              userProp.anniversary.firstDay
                ? <View style={styles.mainContainerStyle}>
                    <Icon style={styles.contentIconStyle} name="briefcase" size={14} color="#333"/>
                    <Text style={styles.contentIconStyle}>{userProp.anniversary.firstDay}</Text>
                  </View>
                : null
          }
          </View>
          <View style={styles.mainTitle}>
            <Text style={styles.mainTitleText}>Family</Text>
            {
              ( this.props.currentUser)
                ? <Icon name="pencil-square-o" size={23} color="#000" style={styles.icon} onPress={() => this.setState({ isFamilyVisible: true })}/>
                : null
            }
            
          </View>
          <View style={styles.mainContent}>
            <View style={styles.mainContainerStyle}>
              <ListView 
                dataSource = {this.state.memberList}
                renderRow = {(rowData) => this.renderMembersOnProfile(rowData)}
                enableEmptySections = {true}
              />
            </View>
          </View>
          <View style={styles.mainTitle}>
            <Text style={styles.mainTitleText}>Favourite things</Text>
            {
              ( this.props.currentUser)
                ? <Icon name="pencil-square-o" size={23} color="#000" style={styles.icon} onPress={() => this.setState({ isFavouriteVisible: true })}/>
                : null
            }
          </View>
          <View style={styles.mainContent}>
            <View style={styles.mainContainerStyle}>
             {
                (infoProp.favourite && infoProp.favourite.drink) ?
                <View style={styles.btnContainer}>
                  <Icon style={styles.contentIconStyle} name="coffee" size={14} color="#333"/>
                  <Text style={styles.contentIconStyle}>{infoProp.favourite.drink}</Text>
                </View> : null
              } 
            </View>
            <View style={styles.mainContainerStyle}>
             {
               ( infoProp.favourite && infoProp.favourite.food) ? 
              <View style={styles.btnContainer}>
                <Icon style={styles.contentIconStyle} name="cutlery" size={14} color="#333"/> 
                <Text style={styles.contentIconStyle}>{infoProp.favourite.food}</Text>
              </View> : null 
              }
            </View>
            <View style={styles.mainContainerStyle}>
              {
                (infoProp.favourite && infoProp.favourite.snack) ?
              <View style={styles.btnContainer}>
                <Icon style={styles.contentIconStyle} name="apple" size={14} color="#333"/> 
                <Text style={styles.contentIconStyle}>{infoProp.favourite.snack}</Text>
              </View> : null
              }
            </View>
            <View style={styles.mainContainerStyle}>
              {
                (infoProp.favourite && infoProp.favourite.music) ?
              <View style={styles.btnContainer}>
                <Icon style={styles.contentIconStyle} name="headphones" size={14} color="#333"/> 
                <Text style={styles.contentIconStyle}>{infoProp.favourite.music}</Text>
              </View> : null
              } 
            </View> 
            <View style={styles.mainContainerStyle}>
              {
                (infoProp.favourite && infoProp.favourite.sport) ?
              <View style={styles.btnContainer}>
                <Icon style={styles.contentIconStyle} name="futbol-o" size={14} color="#333"/> 
                <Text style={styles.contentIconStyle}>{infoProp.favourite.sport}</Text>
              </View> : null
              }
            </View>
          </View>

          <View style={styles.mainTitle}>
            <Text style={styles.mainTitleText}>Interest</Text>
            {
              ( this.props.currentUser)
                ? <Icon name="pencil-square-o" size={23} color="#000" style={styles.icon} onPress={() => this.setState({ isInterestVisible: true })}/>
                : null
            }
            
          </View>
          <View style={styles.mainContent}>
            <View style={styles.mainContainerStyle}>
              {
                infoProp.interest ?
                <View style={styles.btnContainer}>
                  <Icon style={styles.contentIconStyle} name="globe" size={14} color="#333"/> 
                  <Text style={styles.contentIconStyle}>{infoProp.interest}</Text>
                </View> : null
              }
            </View>
          </View>
          <View style={styles.mainTitle}>
            <Text style={styles.mainTitleText}>More Information</Text>
            {
              ( this.props.currentUser)
                ? <Icon name="pencil-square-o" size={23} color="#000" style={styles.icon} onPress={() => this.setState({ isMoreVisible: true })}/>
                : null
            }
            
          </View>
          <View style={styles.mainContent}>
            <View style={styles.mainContainerStyle}>
              {
                infoProp.info ? 
                <View style={styles.btnContainer}>
                  <Icon style={styles.contentIconStyle} name="info" size={14} color="#333"/> 
                  <Text style={styles.contentIconStyle}>{infoProp.info}</Text>
                </View> : null
              }
            </View>
          </View> 
        </View>
      </ScrollView>
    );
  }

  editContact(){
    Actions.editContact({
      uid: this.props.uid
    });
  }

  render() {
    return (
      <View style={{backgroundColor: '#eee', flex: 1, justifyContent: 'center' }}>
        {this.header()}
        {this.renderContent()}
        {
          (!this.state.loadingUser && !this.state.loadingInfo)  ? this.renderWrappers() : null
        }
        {
          this.props.isAdmin
            ? <EditButton
                onEditPress={this.editContact.bind(this)}/>
            : null
        }
    </View>
    );
  }
}

const styles = StyleSheet.create({
  mainStyle: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    marginTop: 5
  },
  floatButton: {
    position: 'absolute',
  },
  columnStyle: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 10,
    marginTop: 5
  },
  center: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  mainTitle: {
    flex: 1, 
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mainTitleText:{
    fontWeight: 'bold',
    justifyContent: 'center'
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 26,
    margin: 10,
  },
  textInput: {
    flex: 1,
    height: 35,
    paddingVertical: 0,
    justifyContent: 'flex-start',
    fontSize: 14
  },
  textInputLong: {
    flexDirection: 'column',
    flex: 1,
    fontSize: 16,
    marginBottom: 7,
    color: '#555'
  },
  errorText: {
    textAlign: 'center',
    color: '#F44336',
    fontSize: 16,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 5,
    borderColor: '#fff',
    borderWidth: 1
  },
  modalTitle: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 18,
    padding: 15
  }, 
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 10,
    borderColor: '#eee',
    borderWidth: 1,
    resizeMode: 'contain'
  },
  bigImage: {
    height: 300,
    resizeMode: 'contain',
  },
  bigAccImage: {
    height: 300,
    resizeMode: 'contain',
    justifyContent: 'center',
    alignSelf: 'center'
  },
  profileImageDetail: {
    width: 100,
    height: 100,
    marginRight: 10,
    borderColor: '#eee',
    borderWidth: 1,
    resizeMode: 'contain'
  },
  namePart: {
    flexDirection: 'column',
  },
  nameFlex: {
    flexDirection: 'row',
    marginBottom: 7,
  },
  generalText: {
    fontSize: 14,
    fontWeight: '700',
    width: 90
  },
  icon: {
    justifyContent: 'flex-end', 
  },
  userName: {
    width: 170
  },
  position: {
    width: 170,
  },
  department: {
    width: 165,
  },
  socialImage: {
    width: 30,
    height: 30,
    marginRight: 8,
    resizeMode: 'contain'
  },
  inputStyle: {
    color: '#333',
    paddingRight: 5,
    paddingLeft: 5,
    fontSize: 14,
    lineHeight: 23,
    flex: 1,
    fontSize: 14
  },
  iconStyle: {
    padding: 8,
    width: 39
  },
  containerStyle: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 8,
    marginRight: 20,
    marginLeft: 20,
    borderColor: '#cccccc'
  },
  btn: {
    alignSelf: 'center',
    width: 90,
    backgroundColor: '#2b78e4',
    borderRadius: 2,
    borderColor: '#98bce1',
    borderWidth: 1,
    marginTop: 7,
    marginBottom: 15
  },
  btntextStyle: {
    alignSelf: 'center',
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    paddingTop: 8,
    paddingBottom: 8
  },
  datePicker: {
    borderColor: '#cccccc',
    width: 253,
    marginRight: 10
  },
  mainContent: {
    paddingBottom: 10,
    paddingTop: 7
  },
  mainContainerStyle: {
    flexDirection: 'row',
    paddingBottom: 4
  },
  contentIconStyle: {
    paddingRight: 8,
    minWidth: 22,
    justifyContent: 'center'
  },
  btnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  headBtn: {
    width: 80,
  },
  longInput: {
    height: 150,
    flexDirection: 'column',
  },
  ProfileImageContainer: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  profileImageText: {
    color: 'red'
  }
});

export { Contact };
