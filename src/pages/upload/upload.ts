import { Component } from '@angular/core';
import { AlertController, NavController, Platform } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { Global } from '../../providers/global';
import { FirebaseClient } from '../../providers/firebase.service';
import { File, FileEntry, Entry } from '@ionic-native/file';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { Crop } from '@ionic-native/crop';

@Component({
  selector: 'page-upload',
  templateUrl: 'upload.html',
  providers: [FirebaseClient, Global]
})
export class UploadPage {
  private progress: boolean;

  constructor(private navCtrl: NavController, private translate: TranslateService, private file: File,
    private cropService: Crop, private platform: Platform, private camera: Camera,
    private global: Global, private firebaseService: FirebaseClient, private alertCtrl: AlertController) {

  }

  pickPicker() {
          console.log("pickPicker1");

    this.translate.get(['get_img_from', 'camera', 'gallery']).subscribe(text => {
      let alert = this.alertCtrl.create({
        message: text['get_img_from'],
        buttons: [{
          text: text['gallery'],
          handler: () => this.pickGallery()
        }]
      });
      alert.present();
    });
  }

  pickGallery() {
    const component = this;
       console.log("pickGalleryuplo");

    this.platform.ready().then(() => {
      if (this.platform.is("cordova")) {
        const options: CameraOptions = {
          quality: 75,
          destinationType: this.platform.is("android") ? this.camera.DestinationType.FILE_URI : this.camera.DestinationType.FILE_URI,
          encodingType: this.camera.EncodingType.JPEG,
      sourceType: this.camera.PictureSourceType.PHOTOLIBRARY
        }
        this.camera.getPicture(options).then((imageData) => {
          this.reduceImage(imageData);
        }, (err) => {
          this.translate.get('camera_err').subscribe(value => this.global.showToast(value));
          console.log("getPicture", JSON.stringify(err));
        });
      }
    });
  }

  pickCamera() {
    this.platform.ready().then(() => {
          console.log("pickCamera2");

      if (this.platform.is("cordova")) {
        const options: CameraOptions = {
          quality: 75,
          destinationType: this.platform.is("android") ? this.camera.DestinationType.FILE_URI : this.camera.DestinationType.NATIVE_URI,
          encodingType: this.camera.EncodingType.JPEG,
      sourceType: this.camera.PictureSourceType.CAMERA
        }
        this.camera.getPicture(options).then((imageData) => {
          this.reduceImage(imageData);
        }, (err) => {
          this.translate.get('camera_err').subscribe(value => this.global.showToast(value));
          console.log("getPicture", JSON.stringify(err));
        });
      }
    });
  }

  reduceImage(selected_pictures: string) {
    this.cropService.crop(selected_pictures, { quality: 100 }).then(cropped_image => this.resolveUri(cropped_image));
  }

  resolveUri(uri: string) {
    // console.log('uriIn', uri);
    // if (this.platform.is("android") && uri.startsWith('content://') && uri.indexOf('/storage/') != -1) {
    //   uri = "file://" + uri.substring(uri.indexOf("/storage/"), uri.length);
    //   console.log('file: ' + uri);
    // }
    this.file.resolveLocalFilesystemUrl(uri).then((entry: Entry) => {
      console.log(entry);
      var fileEntry = entry as FileEntry;
      fileEntry.file(success => {
        var mimeType = success.type;
        console.log("mimeType", mimeType);
        // let dirPath = entry.nativeURL;
        // this.upload(dirPath, entry.name, mimeType);
        var reader = new FileReader();
        reader.onloadend = (evt: any) => {
          var imgBlob: any = new Blob([evt.target.result], { type: mimeType });
          imgBlob.name = entry.name;
          this.uploadBlob(imgBlob);
        };
        reader.onerror = (e) => {
          console.log("FileReaderErr", e);
          this.progress = false;
          this.global.dismissLoading();
        };
        this.translate.get("uploading_doc").subscribe(value => {
          this.progress = true;
          this.global.presentLoading(value);
          reader.readAsArrayBuffer(success);
        });
      }, error => {
        console.log(error);
      });
    })
  }

  uploadBlob(blob) {
    this.firebaseService.uploadBlob(blob).then(url => {
      this.progress = false;
      window.localStorage.setItem("document_url", String(url));
      this.global.dismissLoading();
      this.progress = false;
      this.navCtrl.pop();
    }).catch(err => {
      this.progress = false;
      this.global.dismissLoading();
      this.global.showToast(JSON.stringify(err));
      console.log(err);
      this.translate.get("uploading_fail").subscribe(value => this.global.presentErrorAlert(value));
    });
  }

}
