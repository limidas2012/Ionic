import { Component, Inject } from '@angular/core';
import { NavController } from 'ionic-angular';
import { ChattingPage } from '../chatting/chatting';
import { Chat } from '../../models/chat.models';
import { User } from '../../models/user.models';
import { Constants } from '../../models/constants.models';
import { Global } from '../../providers/global';
import { Message } from '../../models/message.models';
import { TranslateService } from '@ngx-translate/core';
import * as firebase from 'firebase/app';
import { BuyAppAlertPage } from '../buyappalert/buyappalert';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { AppConfig, APP_CONFIG } from '../../app/app.config';
import { ClientService } from '../../providers/client.service';

@Component({
  selector: 'page-chats',
  templateUrl: 'chats.html',
  providers: [ClientService, Global], 
})
export class ChatsPage {
  private chats = new Array<Chat>();
  private chatsAll = new Array<Chat>();
  private userMe: User;
  private searchEnabled = false;
  private myInboxRef: firebase.database.Reference;

  constructor(@Inject(APP_CONFIG) private config: AppConfig,
  private navCtrl: NavController, private global: Global, private translate: TranslateService,
   public inAppBrowser: InAppBrowser,  private service: ClientService) {
    const component = this;
    this.userMe = JSON.parse(window.localStorage.getItem(Constants.KEY_USER));
    console.log("myid", this.userMe.id + "vd");
    this.myInboxRef = firebase.database().ref(Constants.REF_INBOX).child(this.userMe.id + "vd");
    this.myInboxRef.on('child_added', function (data) {
      let newMessage = data.val() as Message;
      if (newMessage && newMessage.id && newMessage.chatId) {
        let newChat = Chat.fromMessage(newMessage, (component.userMe.id + "vd") == newMessage.senderId);
        component.chatsAll.push(newChat);
        component.chatsAll.sort((one, two) => (one.dateTimeStamp > two.dateTimeStamp ? -1 : 1));
        component.chats = component.chatsAll;
        component.global.dismissToast();
      }
    });

    this.myInboxRef.on('child_changed', function (data) {
      var oldMessage = data.val() as Message;
      if (oldMessage && oldMessage.id && oldMessage.chatId) {
        let oldChat = Chat.fromMessage(oldMessage, ((component.userMe.id + "vd") == oldMessage.senderId));
        let oldIndex = -1;
        for (let i = 0; i < component.chatsAll.length; i++) {
          if (oldChat.chatId == component.chatsAll[i].chatId) {
            oldIndex = i;
            break;
          }
        }
        if (oldIndex != -1) {
          component.chatsAll.splice(oldIndex, 1);
          component.chatsAll.unshift(oldChat);
          component.chats = component.chatsAll;
        }
      }
    });

    this.myInboxRef.on('child_removed', function (data) {
      var oldMessage = data.val() as Message;
      console.log("child_removed_msg", oldMessage);
      if (oldMessage && oldMessage.id && oldMessage.chatId) {
        let oldChat = Chat.fromMessage(oldMessage, ((component.userMe.id + "vd") == oldMessage.senderId));
        let indexToRemoveChatsAll = -1;
        for (let i = 0; i < component.chatsAll.length; i++) {
          if (component.chatsAll[i].myId == oldChat.myId && component.chatsAll[i].chatId == oldChat.chatId) {
            indexToRemoveChatsAll = i;
            break;
          }
        }
        if (indexToRemoveChatsAll != -1) {
          component.chatsAll.splice(indexToRemoveChatsAll, 1);
          component.chats = component.chatsAll;
        }

        // let indexToRemoveChats = -1;
        // for (let i = 0; i < component.chats.length; i++) {
        //   if (component.chats[i].myId == oldChat.myId && component.chats[i].chatId == oldChat.chatId) {
        //     indexToRemoveChats = i;
        //     break;
        //   }
        // }
        // if (indexToRemoveChats != -1) component.chats.splice(indexToRemoveChats, 1);
      }
    });

    this.translate.get("just_moment").subscribe(value => {
      this.global.showToast(value);
    });
  }

  enableSearch() {
    this.searchEnabled = !this.searchEnabled;
    if (!this.searchEnabled) {
      this.chats = this.chatsAll;
    }
  }

  getItems(searchbar: any) {
    this.filterCategories(searchbar.srcElement.value);
  }

  filterCategories(query) {
    let filtered = new Array<Chat>();
    if (query && query.length) {
      for (let cat of this.chatsAll) {
        if (cat.chatName.toLowerCase().indexOf(query.toLowerCase()) > -1) {
          filtered.push(cat);
        }
      }
      this.chats = filtered;
    } else {
      this.chats = this.chatsAll;
      this.searchEnabled = false;
    }
  }

  chatscreen(chat) {
    this.navCtrl.push(ChattingPage, { chat: chat });
  }

  buyThisApp(){
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

}