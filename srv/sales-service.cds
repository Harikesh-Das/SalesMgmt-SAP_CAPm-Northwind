using {Northwind} from './external/Northwind';
using {salesmgmt as db} from '../db/schema';


/* Custom Types */
type CustomerSalesData        : {
    customerId   : String;
    customerName : String(100);
    totalOrders  : Integer;
    totalItems   : Integer;
    totalSales   : Decimal;
};

type ProductsSalesData        : {
    productId     : Integer;
    productName   : String(50);
    totalOrders   : Integer;
    totalQuantity : Integer;
    totalRevenue  : Decimal;
};

type EmployeeSalesPerformance : {
    employeeId   : Integer;
    employeeName : String(50);
    totalOrders  : Integer;
    totalItems   : Integer;
    totalRevenue : Decimal;
}

type DashboardData            : {
    employeePerformance : array of EmployeeSalesPerformance;
    topCustomers        : array of CustomerSalesData;
    topProducts         : array of ProductsSalesData;
    
}

//---------------------------------------------------------------------------------------------------

/* Service Definitions with or w/o custom paths and authentication */
@path    : 'sales'
@requires: 'AuthenticatedUser'
service SalesService {

    /* Entity Projections */
    entity SalesUser    as projection on db.SalesUser;
    //-------------------------------------------------------------------------------------------------

    // Access Control for Products
    @restrict: [
        {
            grant: 'READ',
            to   : 'SalesUser'
        },
        {
            grant: [
                'CREATE',
                'UPDATE',
                'DELETE'
            ],
            to   : 'SalesAdmin'
        }
    ]
    entity Products     as projection on Northwind.Products;

    //-----------------------------------------------------------------------------------

    // Access Control for Categories
    @restrict: [
        {
            grant: 'READ',
            to   : 'SalesUser'
        },
        {
            grant: [
                'CREATE',
                'UPDATE',
                'DELETE'
            ],
            to   : 'SalesAdmin'
        }
    ]
    entity Categories   as projection on Northwind.Categories;
    //-----------------------------------------------------------------------------------

    // Access Control for Customers
    @restrict: [
        {
            grant: 'READ',
            to   : 'SalesUser'
        },
        {
            grant: [
                'CREATE',
                'UPDATE',
                'DELETE'
            ],
            to   : 'SalesManager'
        }
    ]
    entity Customers    as projection on Northwind.Customers;
    //-----------------------------------------------------------------------------------

    // Access Control for Orders
    @restrict: [
        {
            grant: 'READ',
            to   : 'SalesUser'
        },
        {
            grant: [
                'CREATE',
                'UPDATE',
                'DELETE'
            ],
            to   : 'SalesManager'
        }
    ]
    entity Orders       as projection on Northwind.Orders;
    //-----------------------------------------------------------------------------------

    // Access Control for OrderDetails
    @restrict: [
        {
            grant: 'READ',
            to   : 'SalesUser'
        },
        {
            grant: [
                'CREATE',
                'UPDATE',
                'DELETE'
            ],
            to   : 'SalesManager'
        }
    ]
    entity OrderDetails as projection on Northwind.Order_Details;
    //-----------------------------------------------------------------------------------

    // Access Control for Employees
    @restrict: [
        {
            grant: 'READ',
            to   : 'SalesManager'
        },
        {
            grant: [
                'CREATE',
                'UPDATE',
                'DELETE'
            ],
            to   : 'SalesAdmin'
        }
    ]
    entity Employees    as projection on Northwind.Employees;
    //-----------------------------------------------------------------------------------

    // Access Control for Suppliers
    @restrict: [
        {
            grant: 'READ',
            to   : 'SalesManager'
        },
        {
            grant: [
                'CREATE',
                'UPDATE',
                'DELETE'
            ],
            to   : 'SalesAdmin'
        }
    ]
    entity Suppliers    as projection on Northwind.Suppliers;
    //--------------------------------------------------------------------------------------------

    /* Custom Actions  with authentication*/

    @requires: 'SalesManager'
    action getCustomerSalesSummary(customerId: String)      returns CustomerSalesData;

    @requires: 'SalesManager'
    action getProductSales(productId: Integer)              returns ProductsSalesData;

    @requires: 'SalesManager'
    action getEmployeeSalesPerformance(employeeId: Integer) returns EmployeeSalesPerformance;

    @requires:'AuthenticatedUser'
    action getDashboard() returns DashboardData;

}
