import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import 'rxjs/add/observable/from';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/concatMap';
import { Observable } from "rxjs/Observable";
import { APP_CONFIG, AppConfig } from "../app/app.config";
import { Country } from '../models/country.models';
import { ResetPasswordResponse } from '../models/reset-password-request.models';
import { AuthResponse } from '../models/auth-response.models';
import { SignInRequest } from '../models/signin-request.models';
import { SignUpRequest } from '../models/signup-request.models';
import { BaseListResponse } from '../models/base-list.models';
import { User } from '../models/user.models';
import { Profile } from '../models/profile.models';
import { ProfileUpdateRequest } from '../models/profile-update-request.models';
import { Appointment } from '../models/appointment.models';
import { RateRequest } from '../models/rate-request.models';
import { WalletResponse } from '../models/wallet-response.models';
import { BankDetail } from '../models/bank-detail.models';
import { Faq } from '../models/faq.models';
import { Rating } from '../models/rating.models';
import { Setting } from '../models/setting.models';
import { Helper } from '../models/helper.models';

@Injectable()
export class ClientService {

  constructor(@Inject(APP_CONFIG) private config: AppConfig, private http: HttpClient) {

  }

  public getCountries(): Observable<Array<Country>> {
    return this.http.get<Array<Country>>('./assets/json/countries.json');
  }

  public getSettings(): Observable<Array<Setting>> {
    const myHeaders = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json' });
    return this.http.get<Array<Setting>>(this.config.apiBase + "api/settings", { headers: myHeaders });
  }

  public checkUser(checkUserRequest: any): Observable<{}> {
    const myHeaders = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json' });
    return this.http.post<{}>(this.config.apiBase + "api/check-user", JSON.stringify(checkUserRequest), { headers: myHeaders });
  }

  public walletHistory(token, pageNo): Observable<BaseListResponse> {
    const myHeaders = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    return this.http.get<BaseListResponse>(this.config.apiBase + "api/wallet/transactions?page=" + pageNo, { headers: myHeaders }).concatMap(data => {
      let lc = Helper.getLocale();
      for (let wh of data.data) {
        wh.amount = Number(wh.amount.toFixed(0));
        wh.created_at = Helper.formatTimestampDateTime(wh.created_at, lc);
        wh.updated_at = Helper.formatTimestampTime(wh.updated_at, lc);
      }
      return Observable.of(data);
    });
  }

  public getUser(token: string): Observable<User> {
    const myHeaders = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    return this.http.get<User>(this.config.apiBase + "api/user", { headers: myHeaders });
  }

  public userReviews(token, pageNo, userId): Observable<BaseListResponse> {
    const myHeaders = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    return this.http.get<BaseListResponse>(this.config.apiBase + "api/user/ratings/" + userId + "?page=" + pageNo, { headers: myHeaders }).concatMap(data => {
      let lc = Helper.getLocale();
      for (let review of data.data) {
        review.created_at = Helper.formatTimestampDate(review.created_at, lc);
      }
      return Observable.of(data);
    });
  }

  public getRatings(token, userId): Observable<Rating> {
    const myHeaders = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    return this.http.get<Rating>(this.config.apiBase + "api/user/ratings/" + userId + "/summary", { headers: myHeaders }).concatMap(data => {
      data.average_rating = Number(data.average_rating).toFixed(2);
      return Observable.of(data);
    });
  }

  public logActivity(token: string): Observable<{}> {
    const myHeaders = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    return this.http.post<{}>(this.config.apiBase + 'api/activity-log', {}, { headers: myHeaders });
  }

  public updateUser(token: string, requestBody: any): Observable<User> {
    const myHeaders = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    return this.http.put<User>(this.config.apiBase + "api/user", requestBody, { headers: myHeaders });
  }

  public signUp(signUpRequest: SignUpRequest): Observable<AuthResponse> {
    const myHeaders = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(this.config.apiBase + "api/register", JSON.stringify(signUpRequest), { headers: myHeaders });
  }

  public myReviews(token: string, pageNo: string): Observable<BaseListResponse> {
    const myHeaders = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    return this.http.get<BaseListResponse>(this.config.apiBase + "api/user/ratings?page=" + pageNo, { headers: myHeaders }).concatMap(data => {
      let lc = Helper.getLocale();
      for (let review of data.data) {
        review.created_at = Helper.formatTimestampDate(review.created_at, lc);
      }
      return Observable.of(data);
    });
  }

  public rateUser(token: string, uId: number, rateRequest: RateRequest): Observable<{}> {
    const myHeaders = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    return this.http.post<{}>(this.config.apiBase + "api/user/ratings/" + uId, JSON.stringify(rateRequest), { headers: myHeaders });
  }

  public updateProfile(token: string, profileRequest: ProfileUpdateRequest): Observable<Profile> {
    const myHeaders = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    return this.http.put<Profile>(this.config.apiBase + "api/driver/profile", JSON.stringify(profileRequest), { headers: myHeaders }).concatMap(data => {
      if (data.vehicle_details && data.vehicle_details.length)
        data.vehicle_details_array = data.vehicle_details.split("|");
      if (!data.price) data.price = 0;
      if (data.locations) {
        data.locations.map(res => {
          if (res.time_start) {
            let timeStartSplit = res.time_start.split(":");
            res.time_start = timeStartSplit.length == 3 ? (timeStartSplit[0] + ":" + timeStartSplit[1]) : res.time_start;
          }
        })
      }
      return Observable.of(data);
    });
  }

  public getProfile(token: string): Observable<Profile> {
    const myHeaders = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    return this.http.get<Profile>(this.config.apiBase + "api/driver/profile", { headers: myHeaders }).concatMap(data => {
      if (data.vehicle_details && data.vehicle_details.length)
        data.vehicle_details_array = data.vehicle_details.split("|");
      if (!data.price) data.price = 0;
      if (data.locations) {
        data.locations.map(res => {
          if (res.time_start) {
            let timeStartSplit = res.time_start.split(":");
            res.time_start = timeStartSplit.length == 3 ? (timeStartSplit[0] + ":" + timeStartSplit[1]) : res.time_start;
          }
        })
      }
      return Observable.of(data);
    });
  }

  public forgetPassword(resetRequest: any): Observable<ResetPasswordResponse> {
    const myHeaders = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json' });
    return this.http.post<ResetPasswordResponse>(this.config.apiBase + "api/forgot-password", JSON.stringify(resetRequest), { headers: myHeaders });
  }

  public verifyMobile(verifyRequest: any): Observable<AuthResponse> {
    const myHeaders = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(this.config.apiBase + "api/verify-mobile", JSON.stringify(verifyRequest), { headers: myHeaders });
  }

  public appointmentUpdate(token: string, apId: number, status: string): Observable<Appointment> {
    const myHeaders = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    return this.http.put<Appointment>(this.config.apiBase + "api/driver/ride/" + apId, { status: status }, { headers: myHeaders }).concatMap(ap => {
      this.presetAppointment(ap, Helper.getLocale());
      return Observable.of(ap);
    });
  }

  public appointments(token: string, pageNo: number): Observable<BaseListResponse> {
    const myHeaders = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    return this.http.get<BaseListResponse>(this.config.apiBase + "api/driver/ride?page=" + pageNo, { headers: myHeaders }).concatMap(data => {
      let lc = Helper.getLocale();
      for (let ap of data.data) {
        this.presetAppointment(ap, lc);
      }
      return Observable.of(data);
    });
  }

  public loginSocial(socialLoginRequest: any): Observable<AuthResponse> {
    const myHeaders = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(this.config.apiBase + "api/social/login", JSON.stringify(socialLoginRequest), { headers: myHeaders });
  }

  public login(loginRequest: SignInRequest): Observable<AuthResponse> {
    const myHeaders = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(this.config.apiBase + "api/login", JSON.stringify(loginRequest), { headers: myHeaders });
  }

  public appointmentsbyStatus(token: string, pageNo: number, status: string): Observable<BaseListResponse> {
    const myHeaders = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    return this.http.get<BaseListResponse>(this.config.apiBase + "api/driver/ride?status=" + status + "&page=" + pageNo, { headers: myHeaders }).concatMap(data => {
      let lc = Helper.getLocale();
      for (let ap of data.data) {
        this.presetAppointment(ap, lc);
      }
      return Observable.of(data);
    });
  }

  public faqs(): Observable<Array<Faq>> {
    const myHeaders = new HttpHeaders({ 'Content-Type': 'application/json', 'Accept': 'application/json' });
    return this.http.get<Array<Faq>>(this.config.apiBase + 'api/faq-help', { headers: myHeaders });
  }

  public referralRefer(token: string, code: string): Observable<{}> {
    const myHeaders = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    return this.http.post<{}>(this.config.apiBase + "api/user/refer", { "code": code }, { headers: myHeaders });
  }

  public walletWithdraw(token, amount): Observable<WalletResponse> {
    const myHeaders = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    return this.http.post<WalletResponse>(this.config.apiBase + "api/wallet/withdraw", JSON.stringify({ "amount": amount }), { headers: myHeaders });
  }

  public bankDetailUpdate(token, bankDetailUpdateRequest): Observable<BankDetail> {
    const myHeaders = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    return this.http.post<BankDetail>(this.config.apiBase + "api/bank-detail", JSON.stringify(bankDetailUpdateRequest), { headers: myHeaders });
  }

  public bankDetail(token): Observable<BankDetail> {
    const myHeaders = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    return this.http.get<BankDetail>(this.config.apiBase + "api/bank-detail", { headers: myHeaders });
  }

  public walletBalance(token): Observable<WalletResponse> {
    const myHeaders = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    return this.http.get<WalletResponse>(this.config.apiBase + "api/wallet/check-balance", { headers: myHeaders });
  }

  public walletRecharge(token, amount, stripeToken): Observable<WalletResponse> {
    const myHeaders = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    return this.http.post<WalletResponse>(this.config.apiBase + "api/wallet/recharge", JSON.stringify({ "token": stripeToken, "amount": amount }), { headers: myHeaders });
  }

  private presetAppointment(ap: Appointment, localeForTime: string) {
    ap.created_at = Helper.formatTimestampDateTime(ap.created_at, localeForTime);
    ap.updated_at = Helper.formatTimestampTime(ap.updated_at, localeForTime);
    ap.ride_on_time = Helper.formatTimestampTime(ap.ride_on, localeForTime);
    ap.ride_on_date = Helper.formatTimestampDate(ap.ride_on, localeForTime);
    ap.ride_on = Helper.formatTimestampDateTime(ap.ride_on, localeForTime);
    if (ap.provider.time_return) ap.provider.time_return = ap.provider.time_return.substring(0, ap.provider.time_return.lastIndexOf(":"));
    if (ap.provider.time_start) ap.provider.time_start = ap.provider.time_start.substring(0, ap.provider.time_start.lastIndexOf(":"));
    if (ap.provider.travel_days) ap.provider.travel_days_array = ap.provider.travel_days.split(",");
    if (ap.provider.vehicle_details) ap.provider.vehicle_details_array = ap.provider.vehicle_details.split("|");
    if (!ap.provider.user.ratings) ap.provider.user.ratings = 0;
    if (!ap.user.ratings) ap.user.ratings = 0;
    ap.canRate = (ap && ap.status == 'complete' && window.localStorage.getItem("rated" + ap.id) == null);
    /* switch (ap.status) {
      case "pending": {
        ap.statusText = "Accept";
        break;
      }
      case "accepted": {
        ap.statusText = "Start Ride";
        break;
      }
      case "onway": {
        ap.statusText = "Pickup";
        break;
      }
      case "ongoing": {
        ap.statusText = "Drop";
        break;
      }
      case "complete": {
        ap.statusText = "Completed";
        break;
      }
      case "cancelled": {
        ap.statusText = "Cancelled";
        break;
      }
      case "rejected": {
        ap.statusText = "Rejected";
        break;
      }
    } */
  }
  public getWhatsappDetails() {
    const myHeaders = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json' });
    return this.http.get('https://dashboard.vtlabs.dev/whatsapp.php?product_name=vroom', { headers: myHeaders }).concatMap(data => {
      return Observable.of(data);
    });
  }
}