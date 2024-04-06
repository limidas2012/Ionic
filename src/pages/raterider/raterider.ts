import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Appointment } from '../../models/appointment.models';
import { Helper } from '../../models/helper.models';
import { ClientService } from '../../providers/client.service';
import { Global } from '../../providers/global';
import { RateRequest } from '../../models/rate-request.models';
import { Subscription } from 'rxjs/Subscription';
import { Constants } from '../../models/constants.models';

@Component({
  selector: 'page-raterider',
  templateUrl: 'raterider.html',
  providers: [ClientService, Global]
})
export class RateriderPage {
  private ap: Appointment;
  private currency: string;
  private rateRequest = new RateRequest();
  private subscriptions: Array<Subscription> = [];

  constructor(private navCtrl: NavController, navParam: NavParams,
    private service: ClientService, private global: Global) {
    this.ap = navParam.get("appointment");
    this.currency = Helper.getSetting("currency");
    this.rateRequest.rating = 3;
  }

  setRating(rating) {
    this.rateRequest.rating = rating;
  }

  submitRating() {
    if (!this.rateRequest.review || !this.rateRequest.review.length) {
      this.global.showToast("Write a short review.");
    } else {
      this.global.presentLoading("Submitting review");
      let subscription: Subscription = this.service.rateUser(window.localStorage.getItem(Constants.KEY_TOKEN), this.ap.user_id, this.rateRequest).subscribe(res => {
        console.log(res);
        window.localStorage.setItem("rated" + this.ap.id, "done");
        window.localStorage.setItem("ratecheck", String(this.ap.id));
        this.global.dismissLoading();
        this.global.showToast("Review submitted");
        this.navCtrl.pop();
      }, err => {
        console.log('submit_rating', err);
        this.global.dismissLoading();
      });
      this.subscriptions.push(subscription);
    }
  }

}