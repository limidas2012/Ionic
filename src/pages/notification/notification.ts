import { Component } from '@angular/core';
import { MyNotification } from '../../models/notification.models';
import { Constants } from '../../models/constants.models';
import { Helper } from '../../models/helper.models';

@Component({
  selector: 'page-notification',
  templateUrl: 'notification.html'
})
export class NotificationPage {
  private notifications = new Array<MyNotification>();

  constructor() {
    console.log("NotificationPage");
  }

  ionViewDidEnter() {
    let notifications: Array<MyNotification> = JSON.parse(window.localStorage.getItem(Constants.KEY_NOTIFICATIONS));
    if (notifications && notifications.length) {
      let locale = Helper.getLocale();
      for (let noti of notifications) {
        noti.time = Helper.formatMillisDate(Number(noti.time), locale);
        if (noti.title.toLowerCase().includes("new ride")) {
          noti.colorclass = "new_appointment";
        } else if (noti.title.toLowerCase().includes("accepted")) {
          noti.colorclass = "new_appointment";
        } else if (noti.title.toLowerCase().includes("onway")) {
          //noti.title = "On the way";
        } else if (noti.title.toLowerCase().includes("ongoing")) {
          //noti.title = "On going";
        } else if (noti.title.toLowerCase().includes("complete")) {
          //noti.title = "Complete";
          noti.colorclass = "completed";
        } else if (noti.title.toLowerCase().includes("cancelled")) {
          noti.colorclass = "cancelled";
        } else if (noti.title.toLowerCase().includes("rejected")) {
          noti.colorclass = "cancelled";
        } else if (noti.title.toLowerCase().includes("message")) {
          noti.colorclass = "new_message";
        }
      }
      this.notifications = notifications.reverse();
    }
  }

}