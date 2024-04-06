//Guideline 2.1 - Performance - App Completeness

//We still found that the app displayed an error message when e tried to log in. Please review the details below and complete the next steps.



import { Component, Inject, ViewChild } from '@angular/core';
import { NavController, App, Platform, AlertController, Events } from 'ionic-angular';
import { SignupPage } from '../signup/signup';
import { ClientService } from '../../providers/client.service';
import { Global } from '../../providers/global';
import { APP_CONFIG, AppConfig } from '../../app/app.config';
import { TranslateService } from '@ngx-translate/core';
import { GooglePlus } from '@ionic-native/google-plus';
import { OtpPage } from '../otp/otp';
import { PasswordPage } from '../password/password';
import { Change_languagePage } from '../change_language/change_language';
import firebase from 'firebase';

@Component({
    selector: 'page-login',
    templateUrl: 'login.html',
    providers: [ClientService, Global]
})
export class LoginPage {
    @ViewChild('inputphone') inputphone;
    private phoneNumber: string;
    private countryCode: string;
    private phoneNumberFull: string;
    private phoneNumberHint: string;
    private countries: any;

    private image_url: string;
    private acceptPrivacyPolicy: boolean = false;
    constructor(@Inject(APP_CONFIG) private config: AppConfig, private app: App, private global: Global, private events: Events,
        private navCtrl: NavController, private clientService: ClientService, private translate: TranslateService,
        private platform: Platform, private google: GooglePlus, private alertCtrl: AlertController) {
        this.getCountries();
        this.changeHint();

        if (this.config.demoMode) {
            if (window.localStorage.getItem("locale_page_shown")) {
                this.openDemoLogin();
            } else {
                window.localStorage.setItem("locale_page_shown", "shown");
                this.navCtrl.push(Change_languagePage);
            }
        }

        //setTimeout(() => this.clientService.login({ email: "vroomdriver@vroom.com", password: "12341234", role: "driver" }).subscribe(res => this.events.publish('auth:login', res)), 5000);
    }

    focusPhone() {
        this.inputphone.setFocus();
    }

    focusCountrySelector() {
        document.getElementById('myCountrySelector').click();
    }

    openDemoLogin() {
        this.countryCode = this.config.demoLoginCredentials.country;
        this.phoneNumber = this.config.demoLoginCredentials.mobileNumber;
        this.translate.get(['demo_login_title', 'demo_login_message', 'okay']).subscribe(text => {
            let alert = this.alertCtrl.create({
                title: text['demo_login_title'],
                message: text['demo_login_message'],
                buttons: [
                    {
                        text: text['okay'],
                        handler: () => {
                        }
                    }]
            });
            alert.present();
        })
    }

    getCountries() {
        this.clientService.getCountries().subscribe(data => {
            //this.countries = data.filter(item => item.name === 'Spain');
            this.countries = data.filter(item => item.name === 'Singapore');
            console.log("current country is coming",this.countries)
        }, err => {
            console.log(err);
        })
    }

    changeHint() {
        this.phoneNumber = "";
        if (this.countryCode && this.countryCode.length) {
            this.translate.get('phone_without').subscribe(value => {
                this.phoneNumberHint = value + " (+" + this.countryCode + ")";
                console.log("current phoneNumberHint is cominggg ifff",this.phoneNumberHint)
            });
        } else {
            this.translate.get('phone').subscribe(value => {
                this.phoneNumberHint = value;
                console.log("current phoneNumberHint is cominggg else",this.phoneNumberHint)
            });
        }
    }

    requestSignIn() {
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
        } else {
            this.alertPhone();
        }
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
                    handler: () => this.checkIfExists()
                }]
            });
            alert.present();
        })
    }

    checkIfExists() {
        this.translate.get('just_moment').subscribe(value => {
            this.global.presentLoading(value);
            this.clientService.checkUser({ mobile_number: this.phoneNumberFull, role: "driver" }).subscribe(res => {
                console.log(res);
                this.global.dismissLoading();
                this.app.getRootNav().setRoot(OtpPage, { phoneNumberFull: this.phoneNumberFull });
            }, err => {
                console.log("checkUser: ", err);
                this.global.dismissLoading();
                this.navCtrl.push(SignupPage, { code: this.countryCode, phone: this.phoneNumber });
            });
        });
    }

    signInGoogle() {
        if (this.config.demoMode) {
            this.global.presentErrorAlert("Google login is not available for demo purpose", "Google login");
        } else {
            this.translate.get('login_google').subscribe(value => {
                this.global.presentLoading(value);
                if (this.platform.is('cordova')) {
                    this.googleOnPhone();
                } else {
                    this.googleOnBrowser();
                }
            });
        }
    }

    googleOnPhone() {
        const provider = {
            'webClientId': this.config.firebaseConfig.webApplicationId,
            'offline': false,
            'scopes': 'profile email'
        };
        this.google.login(provider).then((res) => {
            // this.presentLoading('Google signup success, authenticating with firebase');
            console.log('google_success', res);
            this.image_url = String(res.imageUrl).replace("s96-c", "s500-c");
            const googleCredential = firebase.auth.GoogleAuthProvider.credential(res.idToken);
            firebase.auth().signInAndRetrieveDataWithCredential(googleCredential).then((response) => {
                console.log('google_fire_success', response);
                this.global.dismissLoading();
                this.getFireUserToken(response.user);
            }, (err) => {
                console.log('google_fire_error', err);
                this.global.dismissLoading();
            })
        }, (err) => {
            console.log('google_success', err);
            this.global.dismissLoading();
        })
    }

    googleOnBrowser() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            firebase.auth().signInWithPopup(provider).then((result) => {
                this.global.dismissLoading();
                console.log('google_fire_success', result);
                this.getFireUserToken(result.user);
            }).catch((error) => {
                console.log('google_fire_error', error);
                this.global.dismissLoading();
            });
        } catch (err) {
            this.global.dismissLoading();
            console.log(err);
        }
    }

    getFireUserToken(user) {
        user.getIdToken(false).then(token => {
            console.log('fire_token', token);
            this.requestSignSocialIn(user, { token: token, role: "driver" });
        }).catch(err => {
            console.log('fire_token_err', err);
        });
    }

    requestSignSocialIn(user, socialRequest) {
        this.translate.get('verify_usr').subscribe(value => {
            this.global.presentLoading(value);
        })
        this.clientService.loginSocial(socialRequest).subscribe(res => {
            this.global.dismissLoading();
            if (res.user.mobile_verified == 1) {
                this.events.publish('auth:login', res);
            } else {
                this.app.getRootNav().setRoot(OtpPage, { phoneNumberFull: res.user.mobile_number });
            }
        }, err => {
            this.global.dismissLoading();
            console.log(err);
            this.presentSocialErrorAlert(user);
        });
    }

    presentSocialErrorAlert(user) {
        this.translate.get(['social_create_title', 'social_create_message', 'okay']).subscribe(text => {
            let alert = this.alertCtrl.create({
                title: text['social_create_title'],
                subTitle: text['social_create_message'],
                buttons: [{
                    text: text['okay'],
                    handler: () => {
                        this.navCtrl.push(SignupPage, { user: user, image_url: this.image_url });
                    }
                }]
            });
            alert.present();
        })
    }

    signup() {
        this.app.getRootNav().push(SignupPage);
    }

    passwordRecovery() {
        this.app.getRootNav().push(PasswordPage);
    }

}
