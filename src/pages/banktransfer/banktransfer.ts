import { Component } from '@angular/core';
import { NavController, AlertController } from 'ionic-angular';
import { ClientService } from '../../providers/client.service';
import { Global } from '../../providers/global';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Constants } from '../../models/constants.models';
import { BankDetail } from '../../models/bank-detail.models';
import { User } from '../../models/user.models';
import { Helper } from '../../models/helper.models';

@Component({
  selector: 'page-banktransfer',
  templateUrl: 'banktransfer.html',
  providers: [ClientService, Global]
})
export class BankTransfer {
  private currency: string;
  private subscriptions: Array<Subscription> = [];
  private balance = 0;
  private amount = 0;
  private bankDetail = new BankDetail();

  constructor(private navCtrl: NavController, private service: ClientService,
    private translate: TranslateService, private global: Global, private alertCtrl: AlertController) {
    this.currency = Helper.getSetting("currency");
    let saveBankDetail = window.localStorage.getItem(Constants.KEY_BANK_DETAIL);
    if (saveBankDetail && saveBankDetail.length) {
      this.bankDetail = JSON.parse(saveBankDetail);
    } else {
      this.refreshBankDetail();
    }
    this.translate.get("refreshing").subscribe(value => {
      this.global.showToast(value);
    });
    this.refreshBalance();
  }

  ionViewWillLeave() {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
    this.global.dismissLoading();
  }

  refreshBalance() {
    let subscription: Subscription = this.service.walletBalance(window.localStorage.getItem(Constants.KEY_TOKEN)).subscribe(res => {
      if (!res.balance) res.balance = 0;
      this.balance = res.balance;
    }, err => {
      console.log('walletBalance', err);
    });
    this.subscriptions.push(subscription);
  }

  refreshBankDetail() {
    let subscription: Subscription = this.service.bankDetail(window.localStorage.getItem(Constants.KEY_TOKEN)).subscribe(res => {
      if (res && res.bank_name) {
        this.bankDetail = res;
        window.localStorage.setItem(Constants.KEY_BANK_DETAIL, JSON.stringify(res));
      }
    }, err => {
      console.log('bankDetail', err);
    });
    this.subscriptions.push(subscription);
  }

  confirm() {
    if (!this.bankDetail.bank_name || !this.bankDetail.bank_name.length) {
      this.translate.get("valid_bank_name").subscribe(value => {
        this.global.showToast(value);
      });
    } else if (!this.bankDetail.account_number || !this.bankDetail.account_number.length) {
      this.translate.get("valid_bank_account_number").subscribe(value => {
        this.global.showToast(value);
      });
    } else if (!this.bankDetail.ifsc || !this.bankDetail.ifsc.length) {
      this.translate.get("valid_bank_ifsc").subscribe(value => {
        this.global.showToast(value);
      });
    } else {
      let userMe: User = JSON.parse(window.localStorage.getItem(Constants.KEY_USER));
      let bankDetailUpdateRequest = {
        "name": userMe.name,
        "bank_name": this.bankDetail.bank_name,
        "account_number": this.bankDetail.account_number,
        "ifsc": this.bankDetail.ifsc
      };
      this.translate.get('just_moment').subscribe(text => {
        this.global.presentLoading(text);
      });
      let subscription: Subscription = this.service.bankDetailUpdate(window.localStorage.getItem(Constants.KEY_TOKEN), bankDetailUpdateRequest).subscribe(res => {
        if (res && res.bank_name) {
          this.bankDetail = res;
          window.localStorage.setItem(Constants.KEY_BANK_DETAIL, JSON.stringify(res));
        }
        this.global.dismissLoading();
        this.checkTransfer();
      }, err => {
        console.log('bankDetail', err);
        this.global.dismissLoading();
      });
      this.subscriptions.push(subscription);
    }
  }

  checkTransfer() {
    if (this.balance > 0 && this.amount > 0) {
      if (this.amount <= this.balance) {
        this.translate.get(['transfer_title', 'transfer_message', 'no', 'yes']).subscribe(text => {
          let alert = this.alertCtrl.create({
            title: text['transfer_title'],
            message: text['transfer_message'],
            buttons: [{
              text: text['no'],
              role: 'cancel',
              handler: () => {
                console.log('Cancel clicked');
                this.navCtrl.pop();
              }
            },
            {
              text: text['yes'],
              handler: () => {
                this.initTransfer();
              }
            }]
          });
          alert.present();
        });
      } else {
        this.translate.get('insufficient_fund').subscribe(text => {
          this.global.showToast(text);
        });
      }
    } else {
      this.navCtrl.pop();
    }
  }

  initTransfer() {
    this.translate.get('just_moment').subscribe(text => {
      this.global.presentLoading(text);
    });
    this.subscriptions.push(this.service.walletWithdraw(window.localStorage.getItem(Constants.KEY_TOKEN), this.amount).subscribe(res => {
      this.translate.get('bank_req_done').subscribe(text => {
        this.global.showToast(text);
      });
      this.balance = res.balance;
      console.log(res);
      this.global.dismissLoading();
      this.navCtrl.pop();
    }, err => {
      console.log('transfer_err', err);
      this.global.dismissLoading();
    }));
  }

}
