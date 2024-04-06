import { InjectionToken } from "@angular/core";

export let APP_CONFIG = new InjectionToken<AppConfig>("app.config");

export interface FirebaseConfig {
  apiKey: string,
  authDomain: string,
  databaseURL: string,
  projectId: string,
  storageBucket: string,
  messagingSenderId: string,
  webApplicationId: string
}

export interface AppConfig {
  appName: string;
  apiBase: string;
  googleApiKey: string;
  oneSignalAppId: string;
  oneSignalGPSenderId: string;
  stripeKey: string;
  availableLanguages: Array<any>;
  firebaseConfig: FirebaseConfig;
  demoMode: boolean;
  demoLoginCredentials: { country: string, mobileNumber: string };
}

export const BaseAppConfig: AppConfig = {
  appName: "QuickCar Driver",
  apiBase: "https://admin.quickcar.app/",
  googleApiKey: "AIzaSyCxx-qsoPCarqYAW6iLwAcL8gswtXgq2Gc",
  oneSignalAppId: "a360216b-1557-4491-93dc-252993b656f1",
  oneSignalGPSenderId: "342637392091",
  stripeKey: "pk_live_51Kj4S3HwuzGPWOdFPbDjn8KIwdaFxQZ0eXpnhC9axVTzPfGzGtmqIC59idivrd8uUJHkh2eKys52AAuGHJl2K3Nm00FiTRjssa",
  availableLanguages: [{
    code: 'es',
    name: 'Español'
  }, {
    code: 'en',
    name: 'English'
  }, {
    code: 'ar',
    name: 'عربى'
  }, {
    code: 'fr',
    name: 'français'
  }, {
    code: 'id',
    name: 'bahasa Indonesia'
  }, {
    code: 'pt',
    name: 'português'
  }, {
    code: 'tr',
    name: 'Türk'
  }, {
    code: 'it',
    name: 'Italiana'
  }, {
    code: 'sw',
    name: 'Kiswahili'
  }, {
    code: 'de',
    name: 'Deutsch'
  }, {
    code: 'ro',
    name: 'Română'
  }],
  demoMode: false,
  demoLoginCredentials: { country: "34", mobileNumber: "+34623007444" },
  firebaseConfig: {
    webApplicationId: "342637392091-i9q0sico6mb1tv3sfruane3gke2ad9er.apps.googleusercontent.com",
    apiKey: "AIzaSyCxx-qsoPCarqYAW6iLwAcL8gswtXgq2Gc",
    authDomain: "quickcar-app-dcba9.firebaseapp.com",
    databaseURL: "https://quickcar-app-dcba9-default-rtdb.firebaseio.com",
    projectId: "quickcar-app-dcba9",
    storageBucket: "quickcar-app-dcba9.appspot.com",
    messagingSenderId: "342637392091"
  }
};