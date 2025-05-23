import { Component, OnInit } from '@angular/core';
import { CartItem } from '../../common/cart-item';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart-details',
  standalone: false,
  templateUrl: './cart-details.component.html',
  styleUrl: './cart-details.component.css'
})
export class CartDetailsComponent implements OnInit{


  cartItems:CartItem[]=[];
  totalPrice:number=0;
  totalQuantity:number=0;

  constructor(private cartService: CartService){}

  ngOnInit(): void {
    this.listCartDetails();
    
  }
  listCartDetails() {
    // get a handle to the cart items
    this.cartItems=this.cartService.cartItems;

    //subscribe to the cart total price and total quantity
    this.cartService.totalPrice.subscribe(
      data=> this.totalPrice=data
    );

    this.cartService.totalQuantity.subscribe(
      data=> this.totalQuantity=data
    );

    //compute cart total price and quantity
    this.cartService.computeCartTotals();

  }
  incrementQuantity(tempCartItem: CartItem){
    this.cartService.addToCart(tempCartItem);
  }

  decrementQuantity(tempCartItem: CartItem) {
      this.cartService.decrementQuantity(tempCartItem);
    }
    remove(tempCartItem: CartItem) {
      this.cartService.remove(tempCartItem);
    }

}
