import { Component, Inject, OnInit } from '@angular/core';
import { OKTA_AUTH, OktaAuthStateService } from '@okta/okta-angular';
import { OktaAuth } from '@okta/okta-auth-js';

@Component({
  selector: 'app-login-status',
  standalone: false,
  templateUrl: './login-status.component.html',
  styleUrl: './login-status.component.css'
})
export class LoginStatusComponent implements OnInit{
  
  isAuthenticated:boolean=false;
  userFullName:string='';


  storage:Storage=sessionStorage;

  constructor(private oktaAuthService:OktaAuthStateService,
    @Inject(OKTA_AUTH) private oktaAuth:any
  ){}
  
  ngOnInit(): void {
    //Subscribe to authentication state changes
    this.oktaAuthService.authState$.subscribe(
      (result)=>{
        this.isAuthenticated=result.isAuthenticated!;
        this.getUserDetails();
      }
    );
  }
  getUserDetails() {
    if(this.isAuthenticated){
      //fetch the logged in user details (user's claims)
      this.oktaAuth.getUser().then(
        (res:any)=>{
          this.userFullName=res.name as string;
          //retrieve the users email from the authentication response
          const theEmail=res.email;

          // now store the emailin browser storage
          this.storage.setItem('userEmail',JSON.stringify(theEmail));
          
        }
      );
    }

  }

  logout(){
    // terminate the session with okta and remove current tokens
    this.oktaAuth.signOut();
  }

}
