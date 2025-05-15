import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { from,lastValueFrom,Observable } from 'rxjs';
import { OKTA_AUTH } from '@okta/okta-angular';
import { OktaAuth } from '@okta/okta-auth-js';

@Injectable({
  providedIn: 'root'
})
export class AuthInterceptorService  implements HttpInterceptor{

  constructor(@Inject(OKTA_AUTH) private oktaAuth: any) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    return from(this.handleAccess(request,next))
  }

  private async handleAccess(request:HttpRequest<any>,next:HttpHandler):Promise<HttpEvent<any>>{
    
    //only add an access token for secured endpoints


    const theEndpoint = 'https://localhost:8443/api/orders';
    const securedEndpoints=[theEndpoint];

    if(securedEndpoints.some(url=>request.urlWithParams.includes(url))){

      //get access token
      const accessToken=this.oktaAuth.getAccessToken();

      request=request.clone({
        setHeaders:{
        Authorization:'Bearer '+accessToken
      }
      });
    }
    return await lastValueFrom(next.handle(request));


  }
}
