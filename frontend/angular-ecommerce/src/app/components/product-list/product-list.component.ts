import { Component,OnInit } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { Product } from '../../common/product';
import { ActivatedRoute } from '@angular/router';
import { CartItem } from '../../common/cart-item';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-list',
  standalone: false,
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit{



  products:Product[]=[];
  currentCategoryId:number=1;
  previousCategoryId: number=1;
  searchMode:boolean=false;

  //new props for pagination
  thePageNumber:number=1;
  thePageSize:number=5;
  theTotalElements:number=0;
  

  previousKeyword:string="";


  constructor(private productService:ProductService,
              private route: ActivatedRoute,
              private cartService: CartService
  ){}

  ngOnInit():void{
    this.route.paramMap.subscribe(()=>{
      this.listProducts()
    });
  }
  listProducts() {
    this.searchMode=this.route.snapshot.paramMap.has('keyword');
    if(this.searchMode){
      this.handleSearchProducts();
    }else{
      this.handleListProducts();
    }
    
    
  }
  handleSearchProducts() {
    const theKeyword:string=this.route.snapshot.paramMap.get('keyword')!;

    //if we have a diff keyword then prev
    //then set thePageNumber to 1
    if(this.previousKeyword!=theKeyword){
      this.thePageNumber=1;
    }

    this.previousKeyword=theKeyword;

    console.log(`keyword=${theKeyword},thePageNumber=${this.thePageNumber}`);


    this.productService.searchProductsPaginate(this.thePageNumber-1,
                                               this.thePageSize,
                                               theKeyword ).subscribe(this.processResult());

  }
  handleListProducts(){

    //check if "id" param is available
    const hasCategoryId:boolean=this.route.snapshot.paramMap.has('id');
    if(hasCategoryId){
      // get the "id" param string and convert it to a number
      this.currentCategoryId= +this.route.snapshot.paramMap.get('id')!;
    }else{
      this.currentCategoryId=1;
    }
    //
    //check if we have a different category than prev
    //angular will reuse component if it is currently beig viewd
    //

    //if we have a diff category id than the prev 
    //then we set thePageNumber back to 1

    if(this.previousCategoryId!= this.currentCategoryId){
      this.thePageNumber=1;
    }
    this.previousCategoryId=this.currentCategoryId;
    console.log(`currentCategoryId=${this.currentCategoryId},thePageNumber=${this.thePageNumber}`);
  
    // get products for the given category id

    this.productService.getProductListPaginate(this.thePageNumber-1,
                                               this.thePageSize,
                                               this.currentCategoryId)
                                               .subscribe(this.processResult());

  }

  updatePageSize(pageSize: string) {
    this.thePageSize= +pageSize;
    this.thePageNumber=1;
    this.listProducts();
  }


  processResult(){
    return(data:any)=>{
      this.products=data._embedded.products;
      this.thePageNumber=data.page.number+1;
      this.thePageSize=data.page.size;
      this.theTotalElements=data.page.totalElements;
    }
  }

  addToCart(theProduct: Product) {
    console.log(`Adding to the cart: ${theProduct.name}, ${theProduct.unitPrice}`)


    const theCartItem=new CartItem(theProduct);

    this.cartService.addToCart(theCartItem);
    
  }
}
