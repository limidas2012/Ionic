import { Component } from '@angular/core';
import { NavController, ViewController } from 'ionic-angular';
import { ClientService } from '../../providers/client.service';
import { Global } from '../../providers/global';
import { TranslateService } from '@ngx-translate/core';
import { Constants } from '../../models/constants.models';

@Component({
  selector: 'page-code',
  templateUrl: 'code.html',
  providers: [ClientService, Global]
})
export class CodePage {
  private referralCode: string;

  constructor(private navCtrl: NavController, private viewCtrl: ViewController,
    private translate: TranslateService, private global: Global, private clientService: ClientService) {

  }

  verifyReferral() {
    if (this.referralCode && this.referralCode.length) {
      this.translate.get('referral_verifying').subscribe(value => {
        this.global.presentLoading(value);
      });
      this.clientService.referralRefer(window.localStorage.getItem(Constants.KEY_TOKEN), this.referralCode).subscribe(res => {
        this.global.dismissLoading();
        this.translate.get('referral_verified').subscribe(value => {
          this.global.showToast(value);
        });
        this.dismiss();
      }, err => {
        console.log(err);
        this.global.dismissLoading();
        this.translate.get('referral_verify_error').subscribe(value => {
          this.global.showToast(value);
        });
        this.dismiss();
      });
    } else {
      this.translate.get('invalid_referral').subscribe(value => {
        this.global.showToast(value);
      });
    }
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

}