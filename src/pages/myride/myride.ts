import { Component, Inject } from '@angular/core';
import { NavController, Loading, ModalController } from 'ionic-angular';
import { RateriderPage } from '../raterider/raterider';
import { ChattingPage } from '../chatting/chatting';
import { RidetodayPage } from '../ridetoday/ridetoday';
import { Subscription } from 'rxjs/Subscription';
import { Appointment } from '../../models/appointment.models';
import { ClientService } from '../../providers/client.service';
import { Global } from '../../providers/global';
import { TranslateService } from '@ngx-translate/core';
import { Helper } from '../../models/helper.models';
import { Constants } from '../../models/constants.models';
import { User } from '../../models/user.models';
import { Chat } from '../../models/chat.models';
//import { CallNumber } from '@ionic-native/call-number';
import { RideMapPage } from '../ridemap/ridemap';
import { UserProfilePage } from '../userprofile/userprofile';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { AppConfig, APP_CONFIG } from '../../app/app.config';
import { BuyAppAlertPage } from '../buyappalert/buyappalert';
import { Profile } from '../../models/profile.models';
import { ProfilePage } from '../profile/profile';
import { FindridePage } from '../findride/findride';
import { CodePage } from '../code/code';

@Component({
  selector: 'page-myride',
  templateUrl: 'myride.html',
  providers: [ClientService, Global]
})
export class MyridePage {
  private ride: string = "Pending";
  private currency: string;
  private loading: Loading;
  private isLoading = true;
  private pageNo: number = 1;
  private allDone = false;
  private refresher: any;
  private infiniteScroll: any;
  private subscriptions: Array<Subscription> = [];
  private toShow: Array<Appointment> = [];
  private upcoming: Array<Appointment> = [];
  private complete: Array<Appointment> = [];
  profile: Profile;

  constructor(@Inject(APP_CONFIG) private config: AppConfig, private navCtrl: NavController, private service: ClientService,
    private global: Global, private translate: TranslateService,
    public inAppBrowser: InAppBrowser, private modalCtrl: ModalController) {

    if (!window.localStorage.getItem(Constants.KEY_ASKED_REFERRAL)) {
      let modal = modalCtrl.create(CodePage);
      modal.present();
      window.localStorage.setItem(Constants.KEY_ASKED_REFERRAL, "true");
    }

    this.loadRequests();
    this.currency = Helper.getSetting("currency");
  }

  ionViewDidEnter() {
    let ratecheckId = window.localStorage.getItem("ratecheck");
    if (ratecheckId) {
      let index = -1;
      for (let i = 0; i < this.toShow.length; i++) {
        if (Number(ratecheckId) == this.toShow[i].id) {
          index = i;
          break;
        }
      }
      if (index != -1) {
        this.toShow[index].canRate = (this.toShow[index] && this.toShow[index].status == 'complete' && window.localStorage.getItem("rated" + this.toShow[index].id) == null);
      }
    }
    window.localStorage.removeItem("ratecheck");
  }

  onSegmentChange() {
    setTimeout(() => {
      this.toShow = this.ride == "Pending" ? this.upcoming : this.complete;
    }, 100);
  }

  doRefresh(refresher) {
    if (this.isLoading) refresher.complete();
    this.refresher = refresher;
    this.pageNo = 1;
    this.upcoming = new Array();
    this.complete = new Array();
    this.loadRequests();
  }

  loadRequests() {
    this.isLoading = true;
    let subscription: Subscription = this.service.appointments(window.localStorage.getItem(Constants.KEY_TOKEN), this.pageNo).subscribe(res => {
      let appointments: Array<Appointment> = res.data;
      this.allDone = (!appointments || !appointments.length);
      this.global.dismissLoading();
      let upcoming = new Array<Appointment>();
      let complete = new Array<Appointment>();
      for (let ap of appointments) {
        if (ap.status == 'complete' || ap.status == 'rejected' || ap.status == 'cancelled')
          complete.push(ap);
        else
          upcoming.push(ap);
      }
      if (upcoming.length || complete.length) {
        this.upcoming = this.upcoming.concat(upcoming);
        this.complete = this.complete.concat(complete);
        this.onSegmentChange();
      }
      this.isLoading = false;
      if (this.infiniteScroll) this.infiniteScroll.complete();
      if (this.refresher) this.refresher.complete();
    }, err => {
      console.log('appointments', err);
      this.isLoading = false;
      this.global.dismissLoading();
      if (this.infiniteScroll) this.infiniteScroll.complete();
      if (this.refresher) this.refresher.complete();
    });
    this.subscriptions.push(subscription);
  }

  doInfinite(infiniteScroll: any) {
    this.infiniteScroll = infiniteScroll;
    if (!this.allDone) {
      this.pageNo = this.pageNo + 1;
      this.loadRequests();
    } else {
      infiniteScroll.complete();
    }
  }

  ionViewWillLeave() {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
    this.global.dismissLoading();
  }

  // callUser(ap: Appointment) {
  //   this.callNumber.callNumber(ap.user.mobile_number, true).then(res => console.log('Launched dialer!', res)).catch(err => console.log('Error launching dialer', err));
  // }

  updateJobStatus(statusExplicit: string, index) {
    let statusToUpdate = statusExplicit;
    if (!statusToUpdate) {
      switch (this.toShow[index].status) {
        case "pending": {
          statusToUpdate = "accepted";
          break;
        }
        case "accepted": {
          statusToUpdate = "onway";
          break;
        }
        case "onway": {
          statusToUpdate = "ongoing";
          break;
        }
        case "ongoing": {
          statusToUpdate = "complete";
          break;
        }
      }
    }
    if (statusToUpdate) {
      this.translate.get('updating').subscribe(value => this.global.presentLoading(value));
      let subscription: Subscription = this.service.appointmentUpdate(window.localStorage.getItem(Constants.KEY_TOKEN), this.toShow[index].id, statusToUpdate).subscribe(res => {
        this.toShow[index] = res;
        if (res.status == 'complete' || res.status == 'rejected' || res.status == 'cancelled') {
          this.complete.unshift(this.upcoming.splice(index, 1)[0]);
          this.onSegmentChange();
        }
        this.global.dismissLoading();
      }, err => {
        console.log('update_status', err);
        this.global.dismissLoading();
      });
      this.subscriptions.push(subscription);
    }
  }

  raterider(appointment: Appointment) {
    this.navCtrl.push(RateriderPage, { appointment: appointment });
  }

  chatting(appointment: Appointment) {
    let userMe: User = JSON.parse(window.localStorage.getItem(Constants.KEY_USER));
    let chat = new Chat();
    chat.chatId = appointment.user.id + "vc";
    chat.chatImage = appointment.user.image_url;
    chat.chatName = appointment.user.name;
    chat.chatStatus = appointment.user.profession;
    chat.myId = userMe.id + "vd";
    this.navCtrl.push(ChattingPage, { chat: chat });
  }

  ridetoday() {
    this.navCtrl.push(RidetodayPage);
  }

  rideMap(appointment: Appointment) {
    this.navCtrl.push(RideMapPage, { appointment: appointment });
  }

  userDetail(user: User) {
    this.navCtrl.push(UserProfilePage, { user: user });
  }
  // buyThisApp() {
  // 	let profileModal = this.modalCtrl.create(BuyAppAlertPage);
  // 	profileModal.present();
  // }
  buyThisApp() {
    console.log('open wahtsapp')
    this.translate.get('opening_WhatsApp').subscribe(text => {
      this.global.presentLoading(text);
      this.service.getWhatsappDetails().subscribe((res) => {
        this.global.dismissLoading();
        return this.inAppBrowser.create(res['link'], '_system');
      }, (err) => {
        console.log("Error rating:", JSON.stringify(err));
        this.global.dismissLoading();
      });
    });
  }

  rideInfo() {
    let profile: Profile = JSON.parse(window.localStorage.getItem(Constants.KEY_PROFILE));
    this.profile = profile;
    if (!profile || !profile.vehicle_details || !profile.vehicle_details.length) {
      this.translate.get('setup_profile').subscribe(value => this.global.showToast(value));
      this.navCtrl.push(ProfilePage);
    } else {
      this.navCtrl.push(FindridePage, { profile: this.profile });
    }
  }
}
