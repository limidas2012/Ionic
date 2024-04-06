import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { User } from '../../models/user.models';
import { Review } from '../../models/review.models';
import { Subscription } from 'rxjs/Subscription';
import { Rating } from '../../models/rating.models';
import { RatingSummary } from '../../models/rating-summary.models';
import { Constants } from '../../models/constants.models';
import { ClientService } from '../../providers/client.service';
import { Global } from '../../providers/global';

@Component({
  selector: 'page-userprofile',
  templateUrl: 'userprofile.html',
  providers: [ClientService, Global]
})
export class UserProfilePage {
  private rideprofile = "about";
  private isLoading: boolean;
  private doneAll = false;
  private pageNo = 1;
  private infiniteScroll: any;
  private user: User;
  private rating: Rating;
  private reviews: Array<Review> = [];
  private subscriptions: Array<Subscription> = [];

  constructor(navParam: NavParams, private service: ClientService, private global: Global) {
    this.user = navParam.get("user");
    //this.global.presentLoading("Loading reviews");
    this.loadReviewSummary();
    this.loadReviews();
  }

  ionViewWillLeave() {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }

  loadReviewSummary() {
    let subscription: Subscription = this.service.getRatings(window.localStorage.getItem(Constants.KEY_TOKEN), this.user.id).subscribe(res => {
      let ratingSummaries = RatingSummary.defaultArray();
      for (let ratingSummaryResult of res.summary) {
        ratingSummaries[ratingSummaryResult.rounded_rating - 1].total = ratingSummaryResult.total;
        ratingSummaries[ratingSummaryResult.rounded_rating - 1].percent = ((ratingSummaryResult.total / res.total_ratings) * 100);
      }
      res.summary = ratingSummaries;
      this.rating = res;
    }, err => {
      console.log('rating_err', err);
    });
    this.subscriptions.push(subscription);
  }

  loadReviews() {
    this.isLoading = true;
    let subscription: Subscription = this.service.userReviews(window.localStorage.getItem(Constants.KEY_TOKEN), this.pageNo, this.user.id).subscribe(res => {
      let reviews: Array<Review> = res.data;
      this.reviews = this.reviews.concat(reviews);
      this.isLoading = false;
      this.doneAll = (!res.data || !res.data.length);
      if (this.infiniteScroll) {
        this.infiniteScroll.complete();
      }
      this.global.dismissLoading();
    }, err => {
      console.log('review_list', err);
      this.isLoading = false;
      if (this.infiniteScroll) {
        this.infiniteScroll.complete();
      }
      this.global.dismissLoading();
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

}