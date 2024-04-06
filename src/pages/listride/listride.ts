import { Component } from '@angular/core';
import { NavController, ModalController } from 'ionic-angular';
import { FindridePage } from '../findride/findride';
import { Global } from '../../providers/global';
import { ClientService } from '../../providers/client.service';
import { Subscription } from 'rxjs';
import { Appointment } from '../../models/appointment.models';
import { TranslateService } from '@ngx-translate/core';
import { Constants } from '../../models/constants.models';
import { RideMapPage } from '../ridemap/ridemap';
import { CodePage } from '../code/code';
import { Helper } from '../../models/helper.models';
import { Profile } from '../../models/profile.models';
import { User } from '../../models/user.models';
import { UserProfilePage } from '../userprofile/userprofile';
import { ProfilePage } from '../profile/profile';

@Component({
  selector: 'page-listride',
  templateUrl: 'listride.html',
  providers: [ClientService, Global]
})
export class ListridePage {
  private isLoading: boolean;
  private pageNo: number = 1;
  private allDone = false;
  private refresher: any;
  private infiniteScroll: any;
  private subscriptions: Array<Subscription> = [];
  private toShow: Array<Appointment> = [];
  private createRideTitle = "Ride info";
  private currency: string;
  private profile: Profile;

  constructor(private navCtrl: NavController, private service: ClientService,
    private global: Global, private translate: TranslateService, modalCtrl: ModalController) {
    if (!window.localStorage.getItem(Constants.KEY_ASKED_REFERRAL)) {
      let modal = modalCtrl.create(CodePage);
      modal.present();
      window.localStorage.setItem(Constants.KEY_ASKED_REFERRAL, "true");
    } else {
      this.translate.get('loading_requests').subscribe(value => {
        this.global.presentLoading(value);
      });
    }
    this.currency = Helper.getSetting("currency");
  }

  ionViewWillLeave() {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
    this.global.dismissLoading();
  }

  ionViewDidEnter() {
    this.profile = JSON.parse(window.localStorage.getItem(Constants.KEY_PROFILE));
    this.global.showToast("Refreshing..", 1000);
    this.pageNo = 1;
    this.allDone = false;
    this.toShow = new Array();
    this.loadRequests();

    this.translate.get((this.profile && this.profile.locations && this.profile.locations.length) ? 'edit_ride' : 'create_ride').subscribe(value => {
      this.createRideTitle = value;
    });
  }

  loadRequests() {
    this.isLoading = true;
    let subscription: Subscription = this.service.appointmentsbyStatus(window.localStorage.getItem(Constants.KEY_TOKEN), this.pageNo, "pending").subscribe(res => {
      let appointments: Array<Appointment> = res.data;
      this.allDone = (!appointments || !appointments.length);
      this.toShow = this.toShow.concat(appointments);
      this.global.dismissLoading();
      if (this.infiniteScroll) this.infiniteScroll.complete();
      if (this.refresher) this.refresher.complete();
    }, err => {
      console.log('appointments', err);
      this.global.dismissLoading();
      if (this.infiniteScroll) this.infiniteScroll.complete();
      if (this.refresher) this.refresher.complete();
    });
    this.subscriptions.push(subscription);
  }

  doRefresh(refresher) {
    if (this.isLoading) refresher.complete();
    this.refresher = refresher;
    this.pageNo = 1;
    this.allDone = false;
    this.toShow = new Array();
    this.loadRequests();
  }

  updateJobStatus(status, index) {
    this.translate.get('updating').subscribe(value => {
      this.global.presentLoading(value);
    });
    let subscription: Subscription = this.service.appointmentUpdate(window.localStorage.getItem(Constants.KEY_TOKEN), this.toShow[index].id, status).subscribe(res => {
      this.toShow.splice(index, 1);
      this.global.dismissLoading();
    }, err => {
      console.log('update_status', err);
      this.global.dismissLoading();
    });
    this.subscriptions.push(subscription);
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

  rideMap(appointment: Appointment) {
    this.navCtrl.push(RideMapPage, { appointment: appointment });
  }

  userDetail(user: User) {
    this.navCtrl.push(UserProfilePage, { user: user });
  }


}
