import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OrderHistory } from '../common/order-history';

@Injectable({
  providedIn: 'root'
})
export class OrderHistoryService {
  private orderUrl='https://localhost:8443/api/orders';

  constructor(private httpClient:HttpClient) { }

  getOrderHistory(theEmail:string):Observable<GetResponseOrderHistory>{
    const orderHistoryUrl=`${this.orderUrl}/search/findByCustomerEmailOrderByDateCreatedDesc?email=${theEmail}`;

    return this.httpClient.get<GetResponseOrderHistory>(orderHistoryUrl);
  }
}
interface GetResponseOrderHistory{
  _embedded:{
    orders:OrderHistory[];
  }
}