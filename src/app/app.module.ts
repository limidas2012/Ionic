import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';
import { TabsPage } from '../pages/tabs/tabs';
import { MyridePage } from '../pages/myride/myride';
import { ChatsPage } from '../pages/chats/chats';
import { FindridePage } from '../pages/findride/findride';
import { WalletPage } from '../pages/wallet/wallet';
import { MorePage } from '../pages/more/more';
import { LoginPage } from '../pages/login/login';
import { SignupPage } from '../pages/signup/signup';
import { PasswordPage } from '../pages/password/password';
import { Change_languagePage } from '../pages/change_language/change_language';
import { VerificationPage } from '../pages/verification/verification';
import { CodePage } from '../pages/code/code';
import { ListridePage } from '../pages/listride/listride';
import { FilterPage } from '../pages/filter/filter';
import { RateriderPage } from '../pages/raterider/raterider';
import { ChattingPage } from '../pages/chatting/chatting';
import { ProfilePage } from '../pages/profile/profile';
import { ReviewsPage } from '../pages/reviews/reviews';
import { NotificationPage } from '../pages/notification/notification';
import { TermsPage } from '../pages/terms/terms';
import { EarnPage } from '../pages/earn/earn';
import { HelpPage } from '../pages/help/help';
import { RidetodayPage } from '../pages/ridetoday/ridetoday';
import { UploadPage } from '../pages/upload/upload';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { APP_CONFIG, BaseAppConfig } from "./app.config";
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { OtpPage } from '../pages/otp/otp';
import { SelectareaPage } from '../pages/selectarea/selectarea';
import { GoogleMaps } from '../providers/google-maps';
import { Network } from '@ionic-native/network';
import { Connectivity } from '../providers/connectivity-service';
import { Geolocation } from '@ionic-native/geolocation';
import { GooglePlus } from '@ionic-native/google-plus';
import { OneSignal } from '@ionic-native/onesignal';
import { LongPressModule } from 'ionic-long-press';
import { CallNumber } from '@ionic-native/call-number';
import { AddMoneyPage } from '../pages/addmoney/addmoney';
import { BankTransfer } from '../pages/banktransfer/banktransfer';
import { Stripe } from '@ionic-native/stripe';
import { RideMapPage } from '../pages/ridemap/ridemap';
import { SocialSharing } from '@ionic-native/social-sharing';
import { Clipboard } from '@ionic-native/clipboard';
import { UserProfilePage } from '../pages/userprofile/userprofile';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { Crop } from '@ionic-native/crop';
import { File } from '@ionic-native/file';
import { Camera } from '@ionic-native/camera';
import { BuyAppAlertPage } from '../pages/buyappalert/buyappalert';
import { Vt_popupPage } from '../pages/vt_popup/vt_popup';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    MyApp,
    TabsPage,
    MyridePage,
    ChatsPage,
    FindridePage,
    WalletPage,
    MorePage,
    LoginPage,
    PasswordPage,
    SignupPage,
    VerificationPage,
    CodePage,
    ListridePage,
    FilterPage,
    UserProfilePage,
    RateriderPage,
    ChattingPage,
    ProfilePage,
    ReviewsPage,
    NotificationPage,
    Change_languagePage,
    TermsPage,
    EarnPage,
    HelpPage,
    RidetodayPage,
    UploadPage,
    OtpPage,
    SelectareaPage,
    AddMoneyPage,
    BankTransfer,
    RideMapPage,
    BuyAppAlertPage,
    Vt_popupPage
  ],
  imports: [
    LongPressModule,
    BrowserModule,
    HttpClientModule,
    IonicModule.forRoot(MyApp),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient]
      }
    })
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    TabsPage,
    MyridePage,
    ChatsPage,
    FindridePage,
    WalletPage,
    MorePage,
    LoginPage,
    PasswordPage,
    SignupPage,
    VerificationPage,
    CodePage,
    ListridePage,
    FilterPage,
    UserProfilePage,
    RateriderPage,
    ChattingPage,
    ProfilePage,
    ReviewsPage,
    NotificationPage,
    Change_languagePage,
    TermsPage,
    EarnPage,
    HelpPage,
    RidetodayPage,
    UploadPage,
    OtpPage,
    SelectareaPage,
    AddMoneyPage,
    BankTransfer,
    RideMapPage,
    BuyAppAlertPage,
    Vt_popupPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    GoogleMaps,
    OneSignal,
    Network,
    Connectivity,
    Geolocation,
    GooglePlus,
    CallNumber,
    Stripe,
    SocialSharing,
    Clipboard,
    InAppBrowser,
    Crop, File, Camera,
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    { provide: APP_CONFIG, useValue: BaseAppConfig }
  ]
})
export class AppModule { }
