import { Component } from '@angular/core';
import { NavController, App, Platform, AlertController } from 'ionic-angular';
import { FirebaseClient } from '../../providers/firebase.service';
import { ProfileUpdateRequest } from '../../models/profile-update-request.models';
import { TranslateService } from '@ngx-translate/core';
import { ClientService } from '../../providers/client.service';
import { Profile } from '../../models/profile.models';
import { Subscription } from 'rxjs/Subscription';
import { Constants } from '../../models/constants.models';
import { User } from '../../models/user.models';
import { Global } from '../../providers/global';
import { Helper } from '../../models/helper.models';
import { Review } from '../../models/review.models';
import { UploadPage } from '../upload/upload';
import { ReviewsPage } from '../reviews/reviews';
import { TabsPage } from '../tabs/tabs';
import { RatingSummary } from '../../models/rating-summary.models';
import { Rating } from '../../models/rating.models';
import { File, FileEntry, Entry } from '@ionic-native/file';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { Crop } from '@ionic-native/crop';

@Component({
  selector: 'page-profile',
  templateUrl: 'profile.html',
  providers: [ClientService, FirebaseClient, Global]
})
export class ProfilePage {
  myprofile: string = "about";
  private progress: boolean;
  private profile: Profile;
  private user: User;
  private fileToUpload: any;
  private reviews: Array<Review> = [];
  private subscriptions: Array<Subscription> = [];
  private myprofile_tab: string = "about";
  private uploadType = 1;

  private isLoadingReviews: boolean = true;
  private doneAll = false;
  private pageNo = 1;
  private infiniteScroll: any;
  private rating: Rating;

  constructor(private navCtrl: NavController, private service: ClientService,
    private firebaseService: FirebaseClient, private translate: TranslateService,
    private global: Global, private app: App, private alertCtrl: AlertController, private file: File,
    private cropService: Crop, private platform: Platform, private camera: Camera) {
    this.user = JSON.parse(window.localStorage.getItem(Constants.KEY_USER));
    this.profile = JSON.parse(window.localStorage.getItem(Constants.KEY_PROFILE));
    if (!this.profile) {
      this.profile = Profile.defaultValue();
    } else {
      if (this.profile.vehicle_details && this.profile.vehicle_details.length)
        this.profile.vehicle_details_array = this.profile.vehicle_details.split("|");
    }
    this.refreshProfile();
    this.loadReviewSummary();
    this.loadReviews();
  }

  ionViewDidEnter() {
    setTimeout(() => {
      let document_url = window.localStorage.getItem("document_url");
      if (document_url && document_url.length) {
        this.profile.document_url = document_url;
        this.translate.get("uploading_success").subscribe(value => {
          this.global.showToast(value);
        });
      }
      window.localStorage.removeItem("document_url");
    }, 200);
  }

  loadReviews() {
    this.isLoadingReviews = true;
    let subscription: Subscription = this.service.myReviews(window.localStorage.getItem(Constants.KEY_TOKEN), String(this.pageNo)).subscribe(res => {
      let reviews: Array<Review> = res.data;
      this.reviews = this.reviews.concat(reviews);
      this.global.dismissLoading();
      this.isLoadingReviews = false;
      this.doneAll = (!res.data || !res.data.length);
      if (this.infiniteScroll) {
        this.infiniteScroll.complete();
      }
    }, err => {
      console.log('review_list', err);
      this.global.dismissLoading();
      this.isLoadingReviews = false;
      if (this.infiniteScroll) {
        this.infiniteScroll.complete();
      }
    });
    this.subscriptions.push(subscription);
  }

  loadReviewSummary() {
    let subscription: Subscription = this.service.getRatings(window.localStorage.getItem(Constants.KEY_TOKEN), this.profile.user_id).subscribe(res => {
      let ratingSummaries = RatingSummary.defaultArray();
      for (let ratingSummaryResult of res.summary) {
        ratingSummaries[ratingSummaryResult.rounded_rating - 1].total = ratingSummaryResult.total;
        ratingSummaries[ratingSummaryResult.rounded_rating - 1].percent = ((ratingSummaryResult.total / res.total_ratings) * 100);
      }
      res.summary = ratingSummaries;
      this.rating = res;
      this.user.ratings = Number(res.average_rating);
      this.user.ratingscount = res.total_ratings;
      window.localStorage.setItem(Constants.KEY_USER, JSON.stringify(this.user));
    }, err => {
      console.log('rating_err', err);
    });
    this.subscriptions.push(subscription);
  }

  doInfinite(infiniteScroll: any) {
    if (this.doneAll) {
      infiniteScroll.complete();
    } else {
      this.infiniteScroll = infiniteScroll;
      this.pageNo = this.pageNo + 1;
      this.loadReviews();
    }
  }

  reviewsPage() {
    this.navCtrl.push(ReviewsPage);
  }

  refreshProfile() {
    let subscription: Subscription = this.service.getProfile(window.localStorage.getItem(Constants.KEY_TOKEN)).subscribe(res => {
      if (!res.vehicle_details || !res.vehicle_details.length) {
        this.profile = Profile.defaultValue();
        this.profile.user = res.user;
      } else {
        this.profile = res;
        window.localStorage.setItem(Constants.KEY_PROFILE, JSON.stringify(res));
      }
    }, err => {
      console.log('profile_get_err', err);
    });
    this.subscriptions.push(subscription);
  }

  pickPicker(num) {
    this.uploadType = num;
          console.log("pickPicker2");

    if (this.progress)
      return;
    if (num == 1) {
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
    } else {
      this.navCtrl.push(UploadPage);
    }
  }

  pickGallery() {
    const component = this;
          console.log("pickGallery");

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
          console.log("pickCamera");

      if (this.platform.is("cordova")) {
        const options: CameraOptions = {
          quality: 75,
          destinationType: this.platform.is("android") ? this.camera.DestinationType.FILE_URI : this.camera.DestinationType.FILE_URI,
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

        this.progress = true;
        reader.readAsArrayBuffer(success);
      }, error => {
        console.log(error);
      });
    })
  }

  uploadBlob(blob) {
    this.translate.get(this.uploadType == 1 ? "uploading_image" : "uploading_doc").subscribe(value => {
      this.global.presentLoading(value);
      this.firebaseService.uploadBlob(blob).then(url => {
        this.progress = false;
        this.global.dismissLoading();
        if (this.uploadType == 1) {
          this.profile.user.image_url = String(url);
          this.user.image_url = String(url);
          this.service.updateUser(window.localStorage.getItem(Constants.KEY_TOKEN), { image_url: String(url) }).subscribe(res => {
            console.log(res);
            this.profile.user.image_url = String(url);
            window.localStorage.setItem(Constants.KEY_PROFILE, JSON.stringify(this.profile));
          }, err => {
            console.log('update_user', err);
          });
        } else {
          this.progress = false;
          this.profile.document_url = String(url);
        }
      }).catch(err => {
        this.progress = false;
        this.global.dismissLoading();
        console.log(err);
        //this.translate.get("uploading_fail").subscribe(value => this.global.presentErrorAlert(value));
      });
    });
  }

  saveProfile() {
    if (Helper.isEmpty(this.profile.profession)) {
      this.translate.get('err_profile_profession').subscribe(value => {
        this.global.showToast(value);
      });
    } else if (Helper.isEmpty(this.profile.document_url)) {
      this.translate.get('err_profile_doc').subscribe(value => {
        this.global.showToast(value);
      });
    } else if (Helper.isEmpty(this.profile.vehicle_details_array[0])) {
      this.translate.get('err_profile_vehicle_brand').subscribe(value => {
        this.global.showToast(value);
      });
    } else if (Helper.isEmpty(this.profile.vehicle_details_array[1])) {
      this.translate.get('err_profile_vehicle_model').subscribe(value => {
        this.global.showToast(value);
      });
    } else if (Helper.isEmpty(this.profile.vehicle_details_array[2])) {
      this.translate.get('err_profile_vehicle_color').subscribe(value => {
        this.global.showToast(value);
      });
    } else if (Helper.isEmpty(this.profile.vehicle_details_array[4])) {
      this.translate.get('err_profile_vehicle_number').subscribe(value => {
        this.global.showToast(value);
      });
    } else {
      this.profile.vehicle_details = "";
      for (let vd of this.profile.vehicle_details_array) {
        this.profile.vehicle_details = this.profile.vehicle_details + vd + "|";
      }
      if (this.profile.vehicle_details.endsWith("|")) {
        this.profile.vehicle_details = this.profile.vehicle_details.substring(0, this.profile.vehicle_details.length - 1);
      }
      let profileRequest = new ProfileUpdateRequest();
      profileRequest.profession = this.profile.profession;
      profileRequest.document_url = this.profile.document_url;
      profileRequest.vehicle_details = this.profile.vehicle_details;
      profileRequest.seats = this.profile.seats;
      this.translate.get('profile_updating').subscribe(value => {
        this.global.presentLoading(value);
        console.log('update_request', profileRequest);
        this.subscriptions.push(this.service.updateProfile(window.localStorage.getItem(Constants.KEY_TOKEN), profileRequest).subscribe(res => {
          window.localStorage.setItem(Constants.KEY_PROFILE, JSON.stringify(res));
          window.localStorage.setItem(Constants.KEY_USER, JSON.stringify(res.user));
          this.global.dismissLoading();
          this.app.getRootNav().setRoot(TabsPage);
        }, err => {
          this.global.dismissLoading();
          console.log("profile_update_err", err);
          this.translate.get('profile_updating_fail').subscribe(value => {
            this.global.presentErrorAlert(value);
          });
        }));
      });
    }
  }

}