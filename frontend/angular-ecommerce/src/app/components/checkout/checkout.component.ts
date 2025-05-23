import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Luv2ShopFormService } from '../../services/luv2-shop-form.service';
import { Country } from '../../common/country';
import { State } from '../../common/state';
import { Luv2ShopValidators } from '../../validators/luv2-shop-validators';
import { CartService } from '../../services/cart.service';
import { CheckoutService } from '../../services/checkout.service';
import { Router } from '@angular/router';
import { Order } from '../../common/order';
import { OrderItem } from '../../common/order-item';
import { Purchase } from '../../common/purchase';
import { PaymentInfo } from '../../common/payment-info';

@Component({
  selector: 'app-checkout',
  standalone: false,
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {

  checkoutFormGroup!:FormGroup;
  totalPrice:number=0;
  totalQuantity:number=0;
  creditCardYears:number[]=[];
  creditCardMonths:number[]=[];

  countries:Country[]=[];

  shippingAddressStates:State[]=[];
  billingAddressStates:State[]=[];

  storage:Storage=sessionStorage;
  
  //initialize stripe api
  stripePublishableKey= "pk_test_51ROkA3BLJx3J4fnBFvEmNrvWCRaJBJPKzd1LQuAN1xJCRqoUrXIRkvLEfzOTgh9fFyXs7WiSWPMIrglxaLU78gnf00AgNR2JFZ";

  stripe=Stripe(this.stripePublishableKey);

  paymentInfo:PaymentInfo=new PaymentInfo();
  cardElement:any;
  displayError:any="";

  isDisabled:boolean=false;

  constructor(private formBuilder:FormBuilder,
              private luv2ShopFormService:Luv2ShopFormService,
              private cartService: CartService,
              private checkoutService:CheckoutService,
              private router:Router
  ){}

  ngOnInit(): void {

    //setup stripe payment form
    this.setupStripePaymentForm();



    this.reviewCartDetails();

    //read the user email from browser storage
    const theEmail=JSON.parse(this.storage.getItem('userEmail')!);


    this.checkoutFormGroup=this.formBuilder.group({
      customer:this.formBuilder.group({
        firstName:new FormControl('',
          [Validators.required,Validators.minLength(2),Luv2ShopValidators.notOlyWhitespace]),
        lastName:new FormControl('',[Validators.required,Validators.minLength(2),Luv2ShopValidators.notOlyWhitespace]),
        email:new FormControl(theEmail,
          [Validators.required,Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$'),Luv2ShopValidators.notOlyWhitespace]
        )
      }),
      shippingAddress:this.formBuilder.group({
        street:new FormControl('',
          [Validators.required,Validators.minLength(2),Luv2ShopValidators.notOlyWhitespace]),
        city:new FormControl('',
          [Validators.required,Validators.minLength(2),Luv2ShopValidators.notOlyWhitespace]),
        state:new FormControl('',
          [Validators.required]),
        country:new FormControl('',
          [Validators.required]),
        zipCode:new FormControl('',
          [Validators.required,Validators.minLength(2),Luv2ShopValidators.notOlyWhitespace])
      }),
      billingAddress:this.formBuilder.group({
        street:new FormControl('',
          [Validators.required,Validators.minLength(2),Luv2ShopValidators.notOlyWhitespace]),
        city:new FormControl('',
          [Validators.required,Validators.minLength(2),Luv2ShopValidators.notOlyWhitespace]),
        state:new FormControl('',
          [Validators.required]),
        country:new FormControl('',
          [Validators.required]),
        zipCode:new FormControl('',
          [Validators.required,Validators.minLength(2),Luv2ShopValidators.notOlyWhitespace])
      }),
      creditCard:this.formBuilder.group({

        // cardType:new FormControl('',
        //   [Validators.required]),
        // nameOnCard:new FormControl('',
        //   [Validators.required,Validators.minLength(2),Luv2ShopValidators.notOlyWhitespace]),
        // cardNumber:new FormControl('',
        //   [Validators.required,Validators.pattern('[0-9]{16}')]),
        // securityCode:new FormControl('',
        //   [Validators.pattern('[0-9]{3}'),Validators.required]),
        // expirationMonth:[''],
        // expirationYear:['']

      })
    });


    //populate the credit card months and years

    // const startMonth:number=new Date().getMonth()+1;
    // console.log("startMonth: "+startMonth);
    // this.luv2ShopFormService.getCreditCardMonths(startMonth).subscribe(
    //   data=>{
    //     console.log("Retrieved credit card months: "+ JSON.stringify(data));
    //     this.creditCardMonths=data;
    //   }
    // );

    // this.luv2ShopFormService.getCreditCardYears().subscribe(
    //   data=>{
    //     console.log("Retrieved credit card years: "+ JSON.stringify(data));
    //     this.creditCardYears=data;
    //   }
    // );

    //populate countries and states

    this.luv2ShopFormService.getCountries().subscribe(
      data=>{
        console.log("Retrieved Countried: "+JSON.stringify(data));
        this.countries=data;
      }
    );


  }
  setupStripePaymentForm() {
    //get a handle to stripe elements
    var elements=this.stripe.elements();

    //create a card element
    this.cardElement=elements.create('card',{hidePostalCode:true});

    //add an instance of card ui component into the card-element div
    this.cardElement.mount('#card-element');
    //add event binding for the change event on the card elemen
    this.cardElement.on('change',(event:any)=>{
      //get a handle to card-errors element
      this.displayError=document.getElementById('card-errors');
      if(event.complete){
        this.displayError.textContent="";
      }else if(event.error){
        this.displayError.textContent=event.error.message;
      }
    });


  }
  reviewCartDetails() {
    // subscribe to cart service total quantity and total price
    this.cartService.totalQuantity.subscribe(
      totalQuantity=>this.totalQuantity=totalQuantity
    );
    this.cartService.totalPrice.subscribe(
      totalPrice=>this.totalPrice=totalPrice
    );
  }


  onSubmit(){
    console.log("handling submit");

    if(this.checkoutFormGroup.invalid){
      this.checkoutFormGroup.markAllAsTouched();
      return;
    }

    //set up order
    let order=new Order();
    order.totalPrice=this.totalPrice;
    order.totalQuantity=this.totalQuantity;

    //get cart items
    const cartItems=this.cartService.cartItems;

    //creat orderOtems
    let orderItems:OrderItem[]=cartItems.map(tempCartItem=>new OrderItem(tempCartItem));

    //set up purchase
    let purchase=new Purchase();
    //populate purchase

    purchase.customer=this.checkoutFormGroup.controls['customer'].value


    purchase.shippingAddress=this.checkoutFormGroup.controls['shippingAddress'].value;
    const shippingState:State=JSON.parse(JSON.stringify(purchase.shippingAddress.state));
    const shippingCountry:Country=JSON.parse(JSON.stringify(purchase.shippingAddress.country));
    purchase.shippingAddress.state=shippingState.name;
    purchase.shippingAddress.country=shippingCountry.name;



    purchase.billingAddress=this.checkoutFormGroup.controls['billingAddress'].value;
    const billingState:State=JSON.parse(JSON.stringify(purchase.billingAddress.state));
    const billingCountry:Country=JSON.parse(JSON.stringify(purchase.billingAddress.country));
    purchase.billingAddress.state=billingState.name;
    purchase.billingAddress.country=billingCountry.name;



    purchase.order=order;
    purchase.orderItems=orderItems;

    //compute payment info

    this.paymentInfo.amount=Math.round(this.totalPrice*100);
    this.paymentInfo.currency="USD";
    this.paymentInfo.receiptEmail=purchase.customer.email;


    //call rest api via the checkout service


    //if form valid then create payment intent and confirm card payment and place order

    if(!this.checkoutFormGroup.invalid && this.displayError.textContent===""){
      this.isDisabled=true;
      this.checkoutService.createPaymentIntent(this.paymentInfo).subscribe(
        (paymentIntentRespone)=>{
          this.stripe.confirmCardPayment(paymentIntentRespone.client_secret,
            {
              payment_method:{
                card:this.cardElement,
                billing_details:{
                  email:purchase.customer.email,
                  name:`${purchase.customer.firstName} ${purchase.customer.lastName}`,
                  address:{
                    line1:purchase.billingAddress.street,
                    city:purchase.billingAddress.city,
                    state:purchase.billingAddress.state,
                    postal_code:purchase.billingAddress.zipCode,
                    country:this.billingAddressCountry?.value.code
                  }
                }
              }
            },{handleActions:false}
          ).then((result:any)=>{
            if(result.error){
              alert(`There was an error: ${result.error.message}`);
              this.isDisabled=false;
            }else{
              this.checkoutService.placeOrder(purchase).subscribe({
                next:(response:any)=>{
                  alert(`Your order has been received.\nOrder trackin number:${response.orderTrackingNumber}`);

                  this.resetCart();
                  this.isDisabled=false;
                },
                error:(err:any)=>{
                  alert(`There was an error:${err.message}`);
                  this.isDisabled=false;
                }
              });
            }
          });
        }
      );
    }else{
      this.checkoutFormGroup.markAllAsTouched();
      return;
    }

  }
  resetCart() {
    this.cartService.cartItems=[];
    this.cartService.totalPrice.next(0);
    this.cartService.totalQuantity.next(0);
    this.cartService.persistCartItems();

    this.checkoutFormGroup.reset();

    this.router.navigateByUrl("/products");

    
  }

  get firstName(){return this.checkoutFormGroup.get('customer.firstName');}
  get lastName(){return this.checkoutFormGroup.get('customer.lastName');}
  get email(){return this.checkoutFormGroup.get('customer.email');}

  get shippingAddressStreet(){return this.checkoutFormGroup.get('shippingAddress.street');}
  get shippingAddressCity(){return this.checkoutFormGroup.get('shippingAddress.city');}
  get shippingAddressState(){return this.checkoutFormGroup.get('shippingAddress.state');}
  get shippingAddressZipCode(){return this.checkoutFormGroup.get('shippingAddress.zipCode');}
  get shippingAddressCountry(){return this.checkoutFormGroup.get('shippingAddress.country');}


  get billingAddressStreet(){return this.checkoutFormGroup.get('billingAddress.street');}
  get billingAddressCity(){return this.checkoutFormGroup.get('billingAddress.city');}
  get billingAddressState(){return this.checkoutFormGroup.get('billingAddress.state');}
  get billingAddressZipCode(){return this.checkoutFormGroup.get('billingAddress.zipCode');}
  get billingAddressCountry(){return this.checkoutFormGroup.get('billingAddress.country');}

  get creditCardType(){return this.checkoutFormGroup.get('creditCard.cardType');}
  get creditCardNameOnCard(){return this.checkoutFormGroup.get('creditCard.nameOnCard');}
  get creditCardNumber(){return this.checkoutFormGroup.get('creditCard.cardNumber');}
  get creditCardSecurityCode(){return this.checkoutFormGroup.get('creditCard.securityCode');}


  copyShippingAddreddtoBillingAddress(evt: Event) {
    const checkbox = evt.target as HTMLInputElement;
    if(checkbox.checked){
      (this.checkoutFormGroup.get('billingAddress') as FormGroup)
      .setValue((this.checkoutFormGroup.get('shippingAddress') as FormGroup).value);

      this.billingAddressStates=this.shippingAddressStates;

    }else{
      (this.checkoutFormGroup.get('billingAddress') as FormGroup)
      .reset();

      this.billingAddressStates=[];

    }

  }

  handleMonthsAndYears(){
    const crediCardFormGroup=this.checkoutFormGroup.get('creditCard');

    const currentYear:number=new Date().getFullYear();
    const selectedYear:number=Number(crediCardFormGroup?.value.expirationYear);

    let startMonth:number;
    if(currentYear===selectedYear){
      startMonth=new Date().getMonth()+1;
    }else{
      startMonth=1;
    }
    this.luv2ShopFormService.getCreditCardMonths(startMonth).subscribe(
      data=>{
        console.log("Retrieved credit card months: " +JSON.stringify(data));
        this.creditCardMonths=data;
      }
    );
  }

  getStates(formGroupName:string){
    const formGroup=this.checkoutFormGroup.get(formGroupName);
    const countryCode=formGroup?.value.country.code;
    const countryName=formGroup?.value.country.name;

    console.log(`${formGroupName} country code: ${countryCode}`);
    console.log(`${formGroupName} country name: ${countryName}`);

    this.luv2ShopFormService.getStates(countryCode).subscribe(
      data=>{
        if(formGroupName==='shippingAddress'){
          this.shippingAddressStates=data;
        }else{
          this.billingAddressStates=data;
        }

        formGroup?.get('state')?.setValue(data[0]);
      }
    );

  }



}
