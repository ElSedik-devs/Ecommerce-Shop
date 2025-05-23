import { Component, Inject, OnInit } from '@angular/core';

import myAppConfig from '../../config/my-app-config';
import { OKTA_AUTH } from '@okta/okta-angular';
import {OktaAuth} from '@okta/okta-auth-js';
import OktaSignIn from '@okta/okta-signin-widget';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

  oktaSignIn:any;

  constructor( @Inject(OKTA_AUTH) private oktaAuth: any ){
    this.oktaSignIn=new OktaSignIn({
      logo:'assets/images/logo.png',
      baseUrl:myAppConfig.oidc.issuer.split('/oauth2')[0],
      clientId:myAppConfig.oidc.clientId,
      redirectUri: myAppConfig.oidc.redirectUri,
      authParams:{
        pkce:true,
        issuer:myAppConfig.oidc.issuer,
        scopes:myAppConfig.oidc.scopes
      }
    });
  }


  ngOnInit(): void {
    this.oktaSignIn.remove();

    this.oktaSignIn.renderEl({
      el: '#okta-sign-in-widget'// this name should be same as div tag id in login component
      },
      (response:any)=>{
        if(response.status==='SUCCESS'){
            this.oktaAuth.signInWithRedirect();
        }
        
      },
      (error:any)=>{
        throw error;
      }
    );
    
  }

}
