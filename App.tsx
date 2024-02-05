/* eslint-disable react-native/no-inline-styles */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {useEffect, useState} from 'react';
import RNFS from 'react-native-fs';
import {
  FlatList,
  Image,
  Modal,
  PermissionsAndroid,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';

function App(): React.JSX.Element {
  const [modalVisible, setModalVisible] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [currentPath, setCurrentPath] = useState(RNFS.DocumentDirectoryPath);
  const [folders, setFolders] = useState([]);
  const [photos, setPhotos] = useState([]);

  const requestStoragePermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'App Storage Permission',
          message:
            'App needs access your Storage ' + 'so you can carete folders.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('You can use the storage');
        getAllFolders();
      } else {
        console.log('Storage permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const getCheckPermissionPromise = () => {
    if (Platform.Version >= 33) {
      return Promise.all([
        PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        ),
        PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
        ),
      ]).then(
        ([hasReadMediaImagesPermission, hasReadMediaVideoPermission]) =>
          hasReadMediaImagesPermission && hasReadMediaVideoPermission,
      );
    } else {
      return PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      );
    }
  };

  useEffect(() => {
    requestStoragePermission();
    getCheckPermissionPromise();
    getAllPhotos();
    // uploadToDrive('abc', 'bcd');
  }, []);

  const getAllFolders = () => {
    // get a list of files and directories in the main bundle
    RNFS.readDir(currentPath) // On Android, use "RNFS.DocumentDirectoryPath" (MainBundlePath is not defined)
      .then(result => {
        console.log('GOT RESULT', result);
        setFolders(result);
      })
      .catch(err => {
        console.log(err.message, err.code);
      });
  };

  const getAllPhotos = () => {
    CameraRoll.getPhotos({
      first: 5,
      assetType: 'Photos',
    })
      .then((r: {edges: any}) => {
        console.log(JSON.stringify(r.edges));
        setPhotos(r.edges);
        r.edges.forEach((photo: {node: {image: {uri: any}}}) =>
          uploadToDrive(photo.node.image.uri, photo.node.type),
        );
      })
      .catch((_err: any) => {
        //Error Loading Images
        console.log('got error in getting the files');
      });
  };
  const accessToken =
    'ya29.a0AfB_byAsY78FpD9pomATIylB_RcjFTaqRPIqsGaEtNr32ublEQ96PHzyQGJmio3-j7DkOB0hhYM-xh2B12Fi9o29AOm5xRw_u-XqlizGELsqF7c3j0pv9nbAh8FwuqubmzQo__iyHX2PJSf23GS6_SlKQ6XbglL9U2mFaCgYKAdUSARMSFQHGX2Mi9aD22aSrgg5MbQ51YX-dAg0171';

  const uploadToDrive = async (fileUri: string, mimeType: string) => {
    try {
      // Remove the 'file://' protocol from the fileUri
      const cleanFileUri = fileUri.replace('file://', '');

      console.log('got the file:', fileUri, cleanFileUri, mimeType);
      // Read the file as binary data
      const fileData = await RNFS.readFile(cleanFileUri, 'base64');

      // Construct the request options
      const requestOptions = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'image/png',
        },
        body: fileData,
      };

      // Make the fetch request
      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        requestOptions,
      );

      if (response.ok) {
        console.log('File uploaded successfully!', response);
      } else {
        console.error('Error uploading file to Google Drive:', response);
      }
    } catch (error) {
      console.error('Error uploading file:', error.message);
    }
  };

  return (
    <View style={{flex: 1}}>
      <View
        style={{
          marginTop: 50,
        }}>
        <FlatList
          data={folders}
          renderItem={({item, index}) => {
            return (
              <TouchableOpacity>
                <Text>{item.name}</Text>
              </TouchableOpacity>
            );
          }}
        />
        <FlatList
          data={photos}
          renderItem={({item, index}) => (
            <View key={index}>
              <Image
                source={{uri: item.node.image.uri}}
                style={{width: 300, height: 200}} // Adjust the values based on your design
              />
            </View>
          )}
          keyExtractor={(item, index) => index.toString()} // Ensure each item has a unique key
        />
      </View>
      <TouchableOpacity
        style={{
          position: 'absolute',
          right: 20,
          bottom: 50,
          backgroundColor: '#000',
          width: 50,
          height: 50,
          borderRadius: 25,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={() => {
          console.log('pressed');
          setModalVisible(true);
        }}>
        <Text style={{color: '#fff', fontSize: 30}}>+</Text>
      </TouchableOpacity>
      <Modal
        transparent
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}>
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <View
            style={{
              backgroundColor: '#fff',
              width: '90%',
              height: 200,
              borderRadius: 20,
            }}>
            <TextInput
              placeholder="Enter folder name"
              style={{
                width: '90%',
                height: 50,
                borderWidth: 1,
                alignSelf: 'center',
                marginTop: 50,
                paddingLeft: 20,
                borderRadius: 10,
              }}
            />
            <TouchableOpacity
              style={{
                marginTop: 20,
                alignSelf: 'center',
                width: '90%',
                height: 50,
                borderRadius: 10,
                backgroundColor: '#000',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => {
                console.log('pressed');
                setModalVisible(false);
              }}>
              <Text style={{color: '#fff', fontSize: 20}}>Create Folder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default App;
