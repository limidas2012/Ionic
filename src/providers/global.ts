import { LoadingController, Loading, AlertController, ToastController, Toast } from 'ionic-angular';
import { Injectable, Inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class Global {
  private searchHistory: Array<string>;
  private loadingShown: Boolean = false;
  private loading: Loading;
  private toast: Toast;

  constructor(public loadingCtrl: LoadingController, public toastCtrl: ToastController,
    public alertCtrl: AlertController, public translate: TranslateService) {
  }

  addInSearchHistory(query: string) {
    this.checkSearchHistory();
    let index: number = this.searchHistory.indexOf(query);
    if (index == -1) {
      if (this.searchHistory.length == 5) {
        this.searchHistory.splice(0, 1);
      }
      this.searchHistory.push(query);
      window.localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
    }
  }

  clearSearchHistory() {
    this.searchHistory = new Array<string>();
    window.localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
  }

  checkSearchHistory() {
    if (this.searchHistory == null) {
      let history: Array<string> = JSON.parse(window.localStorage.getItem('searchHistory'));
      if (history != null) {
        this.searchHistory = history;
      } else {
        this.searchHistory = new Array<string>();
      }
    }
  }

  getSearchHistory() {
    this.checkSearchHistory();
    return this.searchHistory;
  }

  presentLoading(message: string) {
    this.loading = this.loadingCtrl.create({
      content: message
    });
    this.loading.onDidDismiss(() => { });
    this.loading.present();
    this.loadingShown = true;
  }

  dismissLoading() {
    if (this.loadingShown) {
      this.loadingShown = false;
      this.loading.dismiss();
    }
  }

  showToast(message: string, duration?: number) {
    this.toast = this.toastCtrl.create({
      message: message,
      duration: duration ? duration : 3000,
      position: 'top'
    });
    this.toast.onDidDismiss(() => {
      console.log('Dismissed toast');
    });
    this.toast.present();
  }

  dismissToast() {
    if (this.toast) {
      this.toast.dismiss();
      this.toast = null;
    }
  }

  presentErrorAlert(msg: string, err?: string) {
    this.translate.get(['error', 'dismiss'])
      .subscribe(text => {
        let alert = this.alertCtrl.create({
          title: err ? err : text['error'],
          subTitle: msg,
          buttons: [text['dismiss']]
        });
        alert.present();
      })
  }
}