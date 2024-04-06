//Guideline 2.1 - Performance - App Completeness

//We were unable to register to the app. It displayed an error message. Please review the details below and complete the next steps.

import { Component, ViewChild } from '@angular/core';
import { NavController, AlertController, App, NavParams, Platform } from 'ionic-angular';
import { ClientService } from '../../providers/client.service';
import { Global } from '../../providers/global';
import { SignUpRequest } from '../../models/signup-request.models';
import { TranslateService } from '@ngx-translate/core';
import { OtpPage } from '../otp/otp';
import { FirebaseClient } from '../../providers/firebase.service';
import { File, FileEntry, Entry } from '@ionic-native/file';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { Crop } from '@ionic-native/crop';

@Component({
    selector: 'page-signup',
    templateUrl: 'signup.html',
    providers: [ClientService, FirebaseClient, Global]
})
export class SignupPage {
    @ViewChild('inputfname') inputfname;
    @ViewChild('inputlname') inputlname;
    @ViewChild('inputphone') inputphone;
    @ViewChild('inputemail') inputemail;
    @ViewChild('inputpassword') inputpassword;
    @ViewChild('inputpasswordconfirm') inputpasswordconfirm;
    private signUpRequest = new SignUpRequest('', '', '', '');
    private phoneNumber: string;
    private countryCode: string;
    private phoneNumberFull: string;
    private phoneNumberHint: string;
    private fileToUpload: any;
    private progress: boolean;
    private countries: any;
    private firstName = "";
    private lastName = "";
    private acceptPrivacyPolicy: boolean = false;
    constructor(private navCtrl: NavController, private clientService: ClientService,
        private alertCtrl: AlertController, private app: App, navParam: NavParams,
        private firebaseService: FirebaseClient, private translate: TranslateService,
        private global: Global, private file: File,
        private cropService: Crop, private platform: Platform, private camera: Camera) {
        this.getCountries();

        let code = navParam.get("code");
        if (code) this.countryCode = code;

        this.changeHint();

        let phone = navParam.get("phone");
        if (phone) this.phoneNumber = phone;

        let user = navParam.get("user");
        if (user && user.email) {
            let nameSplit = user.displayName.split(" ");
            if (nameSplit && nameSplit.length) {
                this.firstName = nameSplit[0];
                if (nameSplit.length > 1)
                    this.lastName = nameSplit[1];
            } else {
                this.firstName = user.displayName;
            }
            this.signUpRequest.email = user.email;
            this.signUpRequest.image_url = navParam.get("image_url");
            // this.signUpRequest.password = Math.random().toString(36).slice(-6);
            // this.passwordConfirm = this.signUpRequest.password;
        }
    }

    focusPasswordConfirm() {
        this.inputpasswordconfirm.setFocus();
    }

    focusPassword() {
        this.inputpassword.setFocus();
    }

    focusPhone() {
        this.inputphone.setFocus();
    }

    focusEmail() {
        this.inputemail.setFocus();
    }

    focusFName() {
        this.inputfname.setFocus();
    }

    focusLName() {
        this.inputlname.setFocus();
    }

    focusCountrySelector() {
        document.getElementById('myCountrySelector').click();
    }

    changeHint() {
        this.phoneNumber = "";
        if (this.countryCode && this.countryCode.length) {
            this.translate.get('phone_without').subscribe(value => {
                this.phoneNumberHint = value + " (+" + this.countryCode + ")";
            });
        } else {
            this.translate.get('phone').subscribe(value => {
                this.phoneNumberHint = value;
            });
        }
    }

    askPicker() {
        this.translate.get(['get_img_from', 'camera', 'gallery']).subscribe(text => {
            let alert = this.alertCtrl.create({
                message: text['get_img_from'],
                buttons: [{
                    text: text['camera'],
                    handler: () => this.pickCamera()
                }, {
                    text: text['gallery'],
                    handler: () => this.pickGallery()
                }]
            });
            alert.present();
        });
    }

    pickGallery() {
        const component = this;
        this.platform.ready().then(() => {
            if (this.platform.is("android")) {
                //{ "mime": "application/pdf" }  // text/plain, image/png, image/jpeg, audio/wav etc
                //(<any>window).fileChooser.open({ "mime": component.uploadType == 1 ? "image/jpeg" : "application/*" }, (uri) => component.reduceImage(uri), (err) => console.log("fileChooser", err)); // with mime filter
                (<any>window).fileChooser.open({ "mime": "image/*" }, (uri) => component.reduceImage(uri), (err) => console.log("fileChooser", err)); // with mime filter
            } else {
                let gpr = { maximumImagesCount: 1, disable_popover: 1 };
                (<any>window).imagePicker.getPictures((results) => {
                    console.log("getPictures", JSON.stringify(results));
                    if (results && results[0]) component.reduceImage(results[0]);
                }, (err) => {
                    console.log("getPictures", JSON.stringify(err));
                }, gpr);
            }
        });
    }

    pickCamera() {
        this.platform.ready().then(() => {
            if (this.platform.is("cordova")) {
                const options: CameraOptions = {
                    quality: 75,
                    destinationType: this.platform.is("android") ? this.camera.DestinationType.FILE_URI : this.camera.DestinationType.NATIVE_URI,
                    encodingType: this.camera.EncodingType.JPEG,
                    mediaType: this.camera.MediaType.PICTURE
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
                this.translate.get("uploading_image").subscribe(value => {
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
            this.global.dismissLoading();
            console.log("Url is", url);
            this.signUpRequest.image_url = String(url);
            this.translate.get("uploading_success").subscribe(value => this.global.showToast(value));
        }).catch(err => {
            this.progress = false;
            this.global.dismissLoading();
            this.global.showToast(JSON.stringify(err));
            console.log(err);
            this.translate.get("uploading_fail").subscribe(value => this.global.presentErrorAlert(value));
        });
    }

    getCountries() {
        this.clientService.getCountries().subscribe(data => {
            this.countries = data;
        }, err => {
            console.log(err);
        })
    }

    validateSignupForm() {
        this.signUpRequest.name = this.firstName + " " + this.lastName;
        var reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
        if (!this.countryCode || !this.countryCode.length) {
            this.translate.get('select_country').subscribe(value => {
                this.global.showToast(value);
                this.focusCountrySelector();
            });
        } else if (!this.phoneNumber || !this.phoneNumber.length) {
            this.translate.get('phone_err').subscribe(value => {
                this.global.showToast(value);
                this.focusPhone();
            });
        } else if (this.signUpRequest.name.length < 3) {
            this.translate.get('invalid_name').subscribe(value => {
                this.global.showToast(value);
                this.focusFName();
            });
        } else if (this.signUpRequest.email.length <= 5 || !reg.test(this.signUpRequest.email)) {
            this.translate.get('invalid_email').subscribe(value => {
                this.global.showToast(value);
                this.focusEmail();
            });
        }
        //  else if (this.signUpRequest.password.length < 6) {
        //     this.translate.get('invalid_password').subscribe(value => {
        //         this.global.showToast(value);
        //         this.focusPassword();
        //     });
        // }
        else {
            this.alertPhone();
        }
    }

    requestSignUp() {
        this.translate.get('signing_up').subscribe(value => {
            this.global.presentLoading(value);
        });
        this.clientService.signUp(this.signUpRequest).subscribe(res => {
            this.global.dismissLoading();
            this.app.getRootNav().setRoot(OtpPage, { phoneNumberFull: res.user.mobile_number });
        }, err => {
            this.global.dismissLoading();

                      this.app.getRootNav().setRoot(OtpPage, { phoneNumberFull: this.phoneNumberFull });

        });
    }

    alertPhone() {
        this.phoneNumberFull = "+" + this.countryCode + this.phoneNumber;
        this.translate.get(['alert_phone', 'no', 'yes']).subscribe(text => {
            let alert = this.alertCtrl.create({
                title: this.phoneNumberFull,
                message: text['alert_phone'],
                buttons: [{
                    text: text['no'],
                    role: 'cancel',
                    handler: () => {
                        console.log('Cancel clicked');
                    }
                }, {
                    text: text['yes'],
                    handler: () => {
                        this.signUpRequest.password = String(Math.floor(100000 + Math.random() * 900000));
                        this.signUpRequest.mobile_number = this.phoneNumberFull;
                        this.requestSignUp();
                    }
                }]
            });
            alert.present();
        })
    }

    login() {
        this.navCtrl.pop();
    }

}
