import { NavController, MenuController, ToastController, NavParams, AlertController } from 'ionic-angular';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { GoogleMaps } from '../../providers/google-maps';
import { Appointment } from '../../models/appointment.models';
import { TranslateService } from '@ngx-translate/core';
import { } from '@types/googlemaps';

@Component({
  selector: 'page-ridemap',
  templateUrl: 'ridemap.html'
})
export class RideMapPage {
  @ViewChild('map') mapElement: ElementRef;
  @ViewChild('pleaseConnect') pleaseConnect: ElementRef;
  private ap: Appointment;
  private initialized: boolean;
  private markerFrom: google.maps.Marker;
  private markerTo: google.maps.Marker;
  private markerMe: google.maps.Marker;
  private posBonds: google.maps.LatLngBounds;

  constructor(private navCtrl: NavController, private menuCtrl: MenuController, private alertCtrl: AlertController,
    navParam: NavParams, private translate: TranslateService, private maps: GoogleMaps,
    private toastCtrl: ToastController) {
    this.menuCtrl.enable(false, 'myMenu');
    this.ap = navParam.get("appointment");
  }

  ionViewDidLoad(): void {
    if (!this.initialized) {
      let mapLoaded = this.maps.init(this.mapElement.nativeElement, this.pleaseConnect.nativeElement).then(() => {
        this.initialized = true;
        this.plotMarkers();
      }).catch(err => {
        console.log(err);
        this.navCtrl.pop();
      });
      mapLoaded.catch(err => {
        console.log(err);
        this.navCtrl.pop();
      });
    }
  }

  plotMarkers() {
    this.posBonds = new google.maps.LatLngBounds();
    let posFrom = new google.maps.LatLng(Number(this.ap.latitude_from), Number(this.ap.longitude_from));
    let posTo = new google.maps.LatLng(Number(this.ap.latitude_to), Number(this.ap.longitude_to));
    this.posBonds.extend(posFrom);
    this.posBonds.extend(posTo);
    if (!this.markerFrom) {
      this.markerFrom = new google.maps.Marker({
        position: posFrom,
        map: this.maps.map,
        icon: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
      });
      this.markerFrom.setClickable(true);
      this.markerFrom.addListener('click', (event) => {
        console.log("markerevent", event);
        this.showToast(this.ap.address_from);
      });
    }
    else {
      this.markerFrom.setPosition(posFrom);
    }

    if (!this.markerTo) {
      this.markerTo = new google.maps.Marker({
        position: posTo,
        map: this.maps.map,
        icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
      });
      this.markerTo.setClickable(true);
      this.markerTo.addListener('click', (event) => {
        console.log("markerevent", event);
        this.showToast(this.ap.address_to);
      });
    }
    else {
      this.markerTo.setPosition(posTo);
    }

    setTimeout(() => {
      this.maps.map.panTo(this.posBonds.getCenter());
    }, 200);

    let directionsService = new google.maps.DirectionsService();
    let directionsDisplay = new google.maps.DirectionsRenderer({
      map: this.maps.map,
      polylineOptions: {
        strokeColor: '#000000',
        strokeOpacity: 1.0,
        strokeWeight: 5
      },
      markerOptions: {
        opacity: 0,
        clickable: false,
        position: posFrom
      }
    });
    directionsService.route({
      origin: posFrom,
      destination: posTo,
      travelMode: google.maps.TravelMode.DRIVING
    }, function (result, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        directionsDisplay.setDirections(result);
      }
    });
  }

  alertLocationServices() {
    this.translate.get(['location_services_title', 'location_services_message', 'okay']).subscribe(text => {
      let alert = this.alertCtrl.create({
        title: text['location_services_title'],
        subTitle: text['location_services_message'],
        buttons: [{
          text: text['okay'],
          role: 'cancel',
          handler: () => {
            console.log('okay clicked');
          }
        }]
      });
      alert.present();
    })
  }

  showToast(message: string) {
    let toast = this.toastCtrl.create({
      message: message,
      duration: 5000,
      position: 'bottom'
    });
    toast.onDidDismiss(() => {
      console.log('Dismissed toast');
    });
    toast.present();
  }

}