import { Injectable } from '@angular/core';
import { CartItem } from '../common/cart-item';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  
  cartItems:CartItem[]=[];

  totalPrice:Subject<number>=new BehaviorSubject<number>(0);
  totalQuantity:Subject<number>=new BehaviorSubject<number>(0);


  storage: Storage=sessionStorage;

  constructor() { 

    //read data from storage
    const item = this.storage.getItem('cartItems');
    let data = item ? JSON.parse(item) : [];
    if(data!=null){
      this.cartItems=data;

      this.computeCartTotals();

    }
  }

  addToCart(theCartItem:CartItem){

    let alreadyExistInCart:boolean=false;
    let existingCartItem: CartItem | undefined = undefined;

    if(this.cartItems.length>0){

      existingCartItem=this.cartItems.find(tempCartItem=>tempCartItem.id===theCartItem.id);

      alreadyExistInCart=(existingCartItem!=undefined)
    }
    
    if(alreadyExistInCart){
      existingCartItem!.quantity++;
    }else{
      this.cartItems.push(theCartItem);
    }

    this.computeCartTotals();

    

  }
  computeCartTotals() {
    let totalPriceValue:number=0;
    let totalQuantityValue:number=0;
    for(let currentCartItem of this.cartItems){
      totalPriceValue+=currentCartItem.quantity*currentCartItem.unitPrice;
      totalQuantityValue+=currentCartItem.quantity;
    }

    this.totalPrice.next(totalPriceValue);
    this.totalQuantity.next(totalQuantityValue);

    this.logCartData(totalPriceValue,totalQuantityValue);

    this.persistCartItems();


  }
  logCartData(totalPriceValue: number, totalQuantityValue: number) {
    console.log(`Contents of the Cart`);
    for(let tempCartItem of this.cartItems){
      const subTotalPrice=tempCartItem.quantity*tempCartItem.unitPrice;
      console.log(`name: ${tempCartItem.name}, quantity=${tempCartItem.quantity},
        unitPrice=${tempCartItem.unitPrice},subtotal=${subTotalPrice}`);
    }
    console.log(`totalPrice:${totalPriceValue.toFixed(2)}, totalQuantity: ${totalQuantityValue}`);
    console.log("---");
  }

  decrementQuantity(theCartItem: CartItem) {
    theCartItem.quantity--;
    if(theCartItem.quantity===0){
      this.remove(theCartItem);
    }else{
      this.computeCartTotals();
    }

  }
  remove(theCartItem: CartItem) {

    //get index of item in array
    const itemIndex=this.cartItems.findIndex(tempCartItem=> tempCartItem.id===theCartItem.id);
    //if found remove form array
    if(itemIndex>-1){
      this.cartItems.splice(itemIndex,1);

      this.computeCartTotals();
    }
  }


  persistCartItems(){
    this.storage.setItem('cartItems',JSON.stringify(this.cartItems));
  }
}
