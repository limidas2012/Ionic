import { Component, ViewChild, Inject } from '@angular/core';
import { Nav, Platform, Events, ModalController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { TabsPage } from '../pages/tabs/tabs';
import { LoginPage } from '../pages/login/login';
import { TranslateService } from '../../node_modules/@ngx-translate/core';
import { AppConfig, APP_CONFIG } from './app.config';
import { ClientService } from '../providers/client.service';
import { User } from '../models/user.models';
import { Constants } from '../models/constants.models';
import { OneSignal } from '@ionic-native/onesignal';
import { MyNotification } from '../models/notification.models';
import { Vt_popupPage } from '../pages/vt_popup/vt_popup';
import firebase from 'firebase';
import { AuthResponse } from '../models/auth-response.models';
import { Global } from '../providers/global';

@Component({
  templateUrl: 'app.html',
  providers: [ClientService, Global]
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;
  private userMe: User;
  rtlSide: string = "left";
  profileMe: any;

  constructor(@Inject(APP_CONFIG) private config: AppConfig, private platform: Platform,
    private oneSignal: OneSignal, events: Events, private global: Global,
    public translate: TranslateService, private statusBar: StatusBar, private splashScreen: SplashScreen,
    private clientService: ClientService, private modalCtrl: ModalController) {
    this.initializeApp();

    events.subscribe('language:selection', (language) => {
      this.clientService.updateUser(window.localStorage.getItem(Constants.KEY_TOKEN), { language: language }).subscribe(res => {
        console.log(res);
      }, err => {
        console.log('update_user', err);
      });
      this.globalize(language);
    });

    events.subscribe('auth:login', (loginRes: AuthResponse) => {
      window.localStorage.setItem(Constants.KEY_USER, JSON.stringify(loginRes.user));
      window.localStorage.setItem(Constants.KEY_TOKEN, loginRes.token);
      this.translate.get("just_moment").subscribe(value => {
        this.global.presentLoading(value);

        this.clientService.getProfile(loginRes.token).subscribe(resProfile => {
          this.global.dismissLoading();
          window.localStorage.setItem(Constants.KEY_PROFILE, JSON.stringify(resProfile));
          this.nav.setRoot(TabsPage, { profile: resProfile });
        }, err => {
          console.log('profile_get_err', err);
          this.global.dismissLoading();
          this.translate.get("smthng_wrng").subscribe(value => this.global.showToast(value));

          window.localStorage.removeItem(Constants.KEY_USER);
          window.localStorage.removeItem(Constants.KEY_PROFILE);
          window.localStorage.removeItem(Constants.KEY_TOKEN);
          this.nav.setRoot(LoginPage);

        });

      });
    });
  }

  getSuitableLanguage(language) {
    window.localStorage.setItem("locale", language);
    language = language.substring(0, 2).toLowerCase();
    console.log('check for: ' + language);
    return this.config.availableLanguages.some(x => x.code == language) ? language : 'en';
  }

  refreshSettings() {
    this.clientService.getSettings().subscribe(res => {
      console.log('setting_setup_success', res);
      window.localStorage.setItem(Constants.KEY_SETTING, JSON.stringify(res));
    }, err => {
      console.log('setting_setup_error', err);
    });
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleLightContent();
      this.splashScreen.show();

      firebase.initializeApp({
        apiKey: this.config.firebaseConfig.apiKey,
        authDomain: this.config.firebaseConfig.authDomain,
        databaseURL: this.config.firebaseConfig.databaseURL,
        projectId: this.config.firebaseConfig.projectId,
        storageBucket: this.config.firebaseConfig.storageBucket,
        messagingSenderId: this.config.firebaseConfig.messagingSenderId
      });

      if (this.platform.is('cordova')) this.initOneSignal();
      let defaultLang = window.localStorage.getItem(Constants.KEY_DEFAULT_LANGUAGE);
      this.globalize(defaultLang ? defaultLang : 'en');
      this.refreshSettings();

      this.userMe = JSON.parse(window.localStorage.getItem(Constants.KEY_USER));
      this.nav.setRoot(this.userMe ? TabsPage : LoginPage);

      setTimeout(() => {
        this.splashScreen.hide();
        if (this.config.demoMode && !window.localStorage.getItem("demo_popup_shown")) {
          window.localStorage.setItem("demo_popup_shown", "shown");
          setTimeout(() => {
            let modal = this.modalCtrl.create(Vt_popupPage);
            modal.onDidDismiss((data) => { });
            modal.present();
          }, 15000);
        }
      }, 3000);
    });
  }

  globalize(languagePriority) {
    this.translate.setDefaultLang("en");
    let defaultLangCode = this.config.availableLanguages[0].code;
    this.translate.use(languagePriority && languagePriority.length ? languagePriority : defaultLangCode);
    this.setDirectionAccordingly(languagePriority && languagePriority.length ? languagePriority : defaultLangCode);
    window.localStorage.setItem(Constants.KEY_LOCALE, languagePriority && languagePriority.length ? languagePriority : defaultLangCode);
  }

  setDirectionAccordingly(lang: string) {
    switch (lang) {
      case 'ar': {
        this.platform.setDir('ltr', false);
        this.platform.setDir('rtl', true);
        this.rtlSide = "right";
        break;
      }
      case 'iw': {
        this.platform.setDir('ltr', false);
        this.platform.setDir('rtl', true);
        this.rtlSide = "right";
        break;
      }
      default: {
        this.platform.setDir('rtl', false);
        this.platform.setDir('ltr', true);
        this.rtlSide = "left";
        break;
      }
    }
  }

  initOneSignal() {
    if (this.config.oneSignalAppId && this.config.oneSignalAppId.length && this.config.oneSignalGPSenderId && this.config.oneSignalGPSenderId.length) {
      this.oneSignal.startInit(this.config.oneSignalAppId, this.config.oneSignalGPSenderId);
      this.oneSignal.inFocusDisplaying(this.oneSignal.OSInFocusDisplayOption.Notification);
      this.oneSignal.handleNotificationReceived().subscribe((data) => {
        console.log(data);
        let notifications: Array<MyNotification> = JSON.parse(window.localStorage.getItem(Constants.KEY_NOTIFICATIONS));
        if (!notifications) notifications = new Array<MyNotification>();
        notifications.push(new MyNotification((data.payload.additionalData && data.payload.additionalData.title) ? data.payload.additionalData.title : data.payload.title,
          (data.payload.additionalData && data.payload.additionalData.body) ? data.payload.additionalData.body : data.payload.body,
          String(new Date().getTime())));
        window.localStorage.setItem(Constants.KEY_NOTIFICATIONS, JSON.stringify(notifications));
        let noti_ids_processed: Array<string> = JSON.parse(window.localStorage.getItem("noti_ids_processed"));
        if (!noti_ids_processed) noti_ids_processed = new Array<string>();
        noti_ids_processed.push(data.payload.notificationID);
        window.localStorage.setItem("noti_ids_processed", JSON.stringify(noti_ids_processed));
      });
      this.oneSignal.handleNotificationOpened().subscribe((data) => {
        let noti_ids_processed: Array<string> = JSON.parse(window.localStorage.getItem("noti_ids_processed"));
        if (!noti_ids_processed) noti_ids_processed = new Array<string>();
        let index = noti_ids_processed.indexOf(data.notification.payload.notificationID);
        if (index == -1) {
          let notifications: Array<MyNotification> = JSON.parse(window.localStorage.getItem(Constants.KEY_NOTIFICATIONS));
          if (!notifications) notifications = new Array<MyNotification>();
          notifications.push(new MyNotification((data.notification.payload.additionalData && data.notification.payload.additionalData.title) ? data.notification.payload.additionalData.title : data.notification.payload.title,
            (data.notification.payload.additionalData && data.notification.payload.additionalData.body) ? data.notification.payload.additionalData.body : data.notification.payload.body,
            String(new Date().getTime())));
          window.localStorage.setItem(Constants.KEY_NOTIFICATIONS, JSON.stringify(notifications));
        } else {
          noti_ids_processed.splice(index, 1);
          window.localStorage.setItem("noti_ids_processed", JSON.stringify(noti_ids_processed));
        }
      });
      this.oneSignal.endInit();
    }
  }

}