using { Northwind } from './external/Northwind';

/* Custom Types */
type CustomerSalesData : {
    customerId:String;
    customerName:String(100);
    totalOrders:Integer;
    totalItems:Integer;
    totalSales:Decimal;
};

type ProductsSalesData : {
    productId: Integer;
    productName: String(50);
    totalOrders: Integer;
    totalQuantity: Integer;
    totalRevenue:Decimal;
};

//---------------------------------------------------------------------------------------------------

/* Service Definitions with or w/o custom paths */
@path: 'sales'
service SalesService {

    entity Products      as projection on Northwind.Products;
    entity Categories    as projection on Northwind.Categories;
    entity Customers     as projection on Northwind.Customers;
    entity Orders        as projection on Northwind.Orders;
    entity OrderDetails  as projection on Northwind.Order_Details;
    entity Employees     as projection on Northwind.Employees;
    entity Suppliers     as projection on Northwind.Suppliers;

    /* Custom Actions */
    action getCustomerSalesSummary (customerId: String) returns CustomerSalesData;
    action getProductSales(productId:String) returns ProductsSalesData;

}