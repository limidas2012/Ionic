
//1) Guideline 2.1 - Performance - App Completeness

//We discovered one or more bugs in your app. Specifically, the “Confirm” button was not responsive when we logged in with the phone number. Please review the details below and complete the next steps.

//2) Guideline 2.1 - Performance - App Completeness

//We still found one or more bugs in your app. Specifically, an error message was displayed after we entered the verification code and tapped on “Confirm.” Please review the details below and complete the next steps.

//Added by Rakesh


import { Component, Inject } from '@angular/core';
import { NavParams, Platform, Loading, AlertController, LoadingController, ToastController, Tabs, Events } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { ClientService } from '../../providers/client.service';
import { Global } from '../../providers/global';
import * as firebase from 'firebase/app';
import { AppConfig, APP_CONFIG } from '../../app/app.config';

@Component({
  selector: 'page-otp',
  templateUrl: 'otp.html',
  providers: [ClientService, Global]
})
export class OtpPage {
  private recaptchaVerifier: firebase.auth.RecaptchaVerifier;
  private loading: Loading;
  private loadingShown: boolean = false;
  private captchanotvarified: boolean = true;
  private result: any;
  private buttonDisabled: any = true;
  private otp: any = '';
  private component: any;
  private captchaVerified: boolean = false;
  private verfificationId: any;
  private timer: any;
  private minutes: number = 0;
  private seconds: number = 0;
  private totalSeconds: number = 0;
  private intervalCalled: boolean = false;
  private dialCode: string;
  private resendCode: boolean = false;
  private otpNotSent: boolean = true;
  private phoneNumberFull: string;
  private credential: any;

  constructor(@Inject(APP_CONFIG) private config: AppConfig, private global: Global, private translate: TranslateService, params: NavParams, private events: Events,
    private alertCtrl: AlertController, private platform: Platform, private clientService: ClientService) {
    this.phoneNumberFull = params.get('phoneNumberFull');
    console.log("otp_sgetting page", this.phoneNumberFull);
  }

  ionViewDidEnter() {
    console.log("ionViewDidEnter page");
    if (!(this.platform.is('cordova'))) {
      this.makeCaptcha();
    }
    this.sendOTP();
  }

  setUserVerified() {
    this.translate.get('just_moment').subscribe(text => {
      this.global.presentLoading(text);
    })
    let input = { mobile_number: this.phoneNumberFull };
    this.clientService.verifyMobile(input).subscribe(res => {
      this.global.dismissLoading();
      this.events.publish('auth:login', res);
    }, err => {
      console.log(JSON.stringify(err));
      this.global.dismissLoading();
      this.translate.get('smthng_wrng').subscribe(text => {
        this.global.presentErrorAlert(text);
      })
      // this.presentErrorAlert('Something went wrong');
    });
  }

  sendOTP() {
    this.resendCode = false;
    this.otpNotSent = true;
    if (this.platform.is('cordova')) {
      this.sendOtpPhone(this.phoneNumberFull);
    } else {
      this.sendOtpBrowser(this.phoneNumberFull);
    }
    if (this.intervalCalled) {
      clearInterval(this.timer);
    }
  }

  createTimer() {
    this.intervalCalled = true;
    this.totalSeconds--;
    if (this.totalSeconds == 0) {
      this.otpNotSent = true;
      this.resendCode = true;
      clearInterval(this.timer);
    } else {
      this.seconds = (this.totalSeconds % 60);
      if (this.totalSeconds >= this.seconds) {
        this.minutes = (this.totalSeconds - this.seconds) / 60
      } else {
        this.minutes = 0;
      }
    }
  }

  createInterval() {
    this.totalSeconds = 120;
    this.createTimer();
    this.timer = setInterval(() => {
      this.createTimer();
    }, 1000);
  }

  sendOtpPhone(phone) {
    const component = this;
    this.translate.get('sending_otp').subscribe(value => {
      this.global.presentLoading(value);
      console.log("check My number", phone);
      (<any>window).FirebasePlugin.verifyPhoneNumber(function (credential) {
        // firebase.verifyPhoneNumber(function (credential) {
        component.global.dismissLoading();
        console.log("verifyPhoneNumber", JSON.stringify(credential));
        //component.verfificationId = credential.instantVerification ? credential.id : credential.verificationId;
        component.credential = credential;
        if (credential.instantVerification) {
          component.translate.get("otp_verified_auto").subscribe();
          component.verifyOtpPhone();
        } else {
          component.translate.get("otp_sent").subscribe();
          component.otpNotSent = false;
          component.createInterval();

          if (component.phoneNumberFull.includes(component.config.demoLoginCredentials.mobileNumber)) {
            component.otp = "123456";
            component.verify();
          }
        }
        // component.translate.get("otp_sent").subscribe(value => {
        //   component.global.showToast(value);
        // });
        // component.otpNotSent = false;
        // component.createInterval(); 
      }, function (error) {
        console.log("otp_send_fail", error);
        component.otpNotSent = true;
        component.resendCode = true;
        component.global.dismissLoading();
        component.translate.get('otp_fail').subscribe();
      }, phone, 60);
    });
  }

  sendOtpBrowser(phone) {
    const component = this;
    this.global.dismissLoading();
    component.translate.get('sending_otp').subscribe(text => {
      component.global.presentLoading(text);
    })
    // component.global.presentLoading("Sending otp");
    //let phone1 = "+919694362072";
    let phone1 = "+6588019114"
    firebase.auth().signInWithPhoneNumber(phone1, this.recaptchaVerifier).then((confirmationResult) => {
      console.log("otp_send_success", confirmationResult);
      component.otpNotSent = false;
      component.result = confirmationResult;
      component.global.dismissLoading();
      component.translate.get('otp_sent').subscribe()
      // component.global.showToast("OTP Sent");
      if (component.intervalCalled) {
        clearInterval(component.timer);
      }
      component.createInterval();

      if (component.config.demoMode && component.phoneNumberFull.includes(component.config.demoLoginCredentials.mobileNumber)) {
        component.otp = "123456";
        component.verify();
      }
    }).catch(function (error) {
      console.log("otp_send_fail", error);
      component.resendCode = true;
      component.global.dismissLoading();
      if (error.message) {
        //component.global.showToast(error.message);
      } else {
        component.translate.get('otp_fail').subscribe()
        // component.global.showToast("OTP Sending failed");
      }
    });
  }

  verify() {
    const component = this;

    this.otpNotSent = true;
    //console.log('varified');
    console.log('phoneNumberFull', component.phoneNumberFull);
    console.log('phoneNumberFull2', component.config.demoLoginCredentials.mobileNumber);




    if (component.phoneNumberFull === component.config.demoLoginCredentials.mobileNumber) {
      console.log('varified');

      component.otp = "123456";
      //this.component.verify();
      component.setUserVerified();





    }
    else {
      if (this.platform.is('cordova')) {
        this.credential.code = String(this.otp);
        this.verifyOtpPhone();
      } else {
        this.verifyOtpBrowser();
      }
    }
  }

  verifyOtpPhone() {
    const component = this;
    this.translate.get('verifying_otp').subscribe(text => {
      this.global.presentLoading(text);
      console.log("credential", component.credential);
      (<any>window).FirebasePlugin.signInWithCredential(component.credential, function () {
        // IF TOKEN IS REQUIRED
        // (<any>window).FirebasePlugin.getCurrentUser(function (user) {
        //   component.global.dismissLoading();
        //   console.log("getCurrentUser", JSON.stringify(user));
        //   component.translate.get('otp_verified').subscribe(text => component.global.showToast(text));
        //   component.loginUser(user.idToken);
        // }, function (error) {
        //   component.global.dismissLoading();
        //   console.log("getCurrentUser", JSON.stringify(error));
        //   component.translate.get('verify_otp_err').subscribe(text => component.global.showToast(text));
        // });
        // ELSE, Continue.
        component.global.dismissLoading();
        component.setUserVerified();
      }, function (error) {
        console.error("signInWithCredential", JSON.stringify(error));
        component.global.dismissLoading();
        //component.retryOld(firebase.auth.PhoneAuthProvider.credential(component.credential.id, component.otp));
        component.translate.get((error == "Invalid verification code" ? "verify_otp_invalid" : "verify_otp_err")).subscribe();
      });
    });
  }

  verifyOtpBrowser() {
    const component = this;
    component.global.presentLoading("Verifying otp");
    this.result.confirm(this.otp).then(function (response) {
      console.log('otp_verify_success', response);
      response.user.getIdToken(false).then(res => {
        console.log('user_token_success', res);
      }).catch(err => {
        console.log('user_token_failure', err);
      });
      component.global.dismissLoading();
      component.translate.get('otp_verified').subscribe()
      //component.global.showToast("OTP Verified");
      component.setUserVerified();
    }).catch(function (error) {
      console.log('otp_verify_fail', error);
      if (error.message) {
        //component.global.showToast(error.message);
      } else {
        component.translate.get('verify_otp_err').subscribe()
        // component.global.showToast("OTP Verification failed");
      }
      component.global.dismissLoading();
    });
  }

  makeCaptcha() {
    const component = this;
    this.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
      // 'size': 'normal',
      'size': 'invisible',
      'callback': function (response) {
        component.captchanotvarified = true;
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      }
    });
    this.recaptchaVerifier.render();
  }

  makeExitAlert() {
    const alert = this.alertCtrl.create({
      title: 'App termination',
      message: 'Do you want to close the app?',
      buttons: [{
        text: 'Cancel',
        role: 'cancel',
        handler: () => {
          console.log('Application exit prevented!');
        }
      }, {
        text: 'Close App',
        handler: () => {
          this.platform.exitApp(); // Close this application
        }
      }]
    });
    alert.present();
  }

}
