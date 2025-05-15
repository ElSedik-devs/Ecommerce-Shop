package com.youssef.ecommerce.service;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.youssef.ecommerce.dao.CustomerRepository;
import com.youssef.ecommerce.dto.PaymentInfo;
import com.youssef.ecommerce.dto.Purchase;
import com.youssef.ecommerce.dto.PurchaseResponse;
import com.youssef.ecommerce.entity.Customer;
import com.youssef.ecommerce.entity.Order;
import com.youssef.ecommerce.entity.OrderItem;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class CheckoutServiceImpl implements CheckoutService {

    private CustomerRepository customerRepository;




    public CheckoutServiceImpl(CustomerRepository customerRepository, @Value("${stripe.key.secret}") String secretKey) {
        this.customerRepository = customerRepository;

        //initialize stripe api with the secret key

        Stripe.apiKey = secretKey;
    }

    @Override
    @Transactional
    public PurchaseResponse placeOrder(Purchase purchase) {
        //retrieve the order info from the dto
        Order order=purchase.getOrder();

        //generate tracking number
        String orderTrackingNumber=generateOrderTrackingNumber();
        order.setOrderTrackingNumber(orderTrackingNumber);

        //populate order with orderitems
        Set<OrderItem> orderItems=purchase.getOrderItems();
        orderItems.forEach(item ->order.add(item) );

        //populate order with billing and sipping address
        order.setBillingAddress(purchase.getBillingAddress());
        order.setShippingAddress(purchase.getShippingAddress());

        //populate costumer with order
        Customer customer=purchase.getCustomer();

        //check if this is an existing customer
        String theEmail=customer.getEmail();

        Customer customerFromDB=customerRepository.findByEmail(theEmail);

        if(customerFromDB!=null){
            customer=customerFromDB;
        }

        customer.add(order);

        //save to db
        customerRepository.save(customer);

        //return response

        return new PurchaseResponse(orderTrackingNumber);
    }

    @Override
    public PaymentIntent createPaymentIntent(PaymentInfo paymentInfo) throws StripeException {

        List<String> paymentMethodTypes=new ArrayList<>();
        paymentMethodTypes.add("card");

        Map<String,Object> params=new HashMap<>();
        params.put("amount",paymentInfo.getAmount());
        params.put("currency",paymentInfo.getCurrency());
        params.put("payment_method_types",paymentMethodTypes);
        params.put("description","Luv2Shop purchase");
        params.put("receipt_email",paymentInfo.getReceiptEmail());



        return PaymentIntent.create(params);
    }

    private String generateOrderTrackingNumber() {
        //generate a random uuid number
        return UUID.randomUUID().toString();
    }
}













