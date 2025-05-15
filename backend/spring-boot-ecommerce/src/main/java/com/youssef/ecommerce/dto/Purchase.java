package com.youssef.ecommerce.dto;

import com.youssef.ecommerce.entity.Address;
import com.youssef.ecommerce.entity.Customer;
import com.youssef.ecommerce.entity.Order;
import com.youssef.ecommerce.entity.OrderItem;
import lombok.Data;

import java.util.Set;

@Data
public class Purchase {

    private Customer customer;
    private Address shippingAddress;
    private Address billingAddress;
    private Order order;
    private Set<OrderItem> orderItems;

}
