import cds from "@sap/cds";

/*  Possible Features to add
1. Employee Sales Performance        Done
2. Customer Sales Summary               Done
3. Sales Dashboard                   Done
4.  getSupplierSalesPerformance(supplierId) next
5. getTopSuppliers()*/


export default cds.service.impl(async function () {
    /* Connect to External Service */
    const Northwind = await cds.connect.to("Northwind");
    //--------------------------------------------------------------------------------------------------

    /* Get the entities from external service and local service */
    const { Products, Customers, Orders, OrderDetails } = this.entities; // From Northwind
    const { SalesUser } = cds.entities('salesmgmt'); // From schema.cds
    //--------------------------------------------------------------------------------------------------------

    /* Event Handlers */

    // READ requests handler to Northwind
    this.on(
        "READ",
        [
            Products,
            this.entities.Categories,
            Customers,
            Orders,
            OrderDetails,
            this.entities.Employees,
            this.entities.Suppliers,
        ],
        async (req) => {
            return Northwind.tx(req).run(req.query);
        },
    );
    //-------------------------------------------------------------------------------------

    // Customer Sales Summary Handler : tells us How much business have we done with this customer?
    this.on("getCustomerSalesSummary", async (req) => {
        const { customerId } = req.data;

        const customer = await Northwind.run(
            SELECT.one.from("Northwind.Customers").where({ CustomerID: customerId }),
        );

        if (!customer) return req.error(404, `Customer ${customerId} not found`);


        const orders = await Northwind.run(
            SELECT.from("Northwind.Orders").where({ CustomerID: customerId }),
        );

        const orderIds = orders.map((order) => order.OrderID);

        if (orderIds.length === 0) {
            return {
                customerId,
                customerName: customer.CompanyName,
                totalOrders: 0,
                totalItems: 0,
                totalSales: 0,
            };
        }

        const details = await Northwind.run(
            SELECT.from("Northwind.Order_Details").where({
                OrderID: { in: orderIds },
            }),
        );

        let totalItems = 0;
        let totalSales = 0;

        for (const detail of details) {
            totalItems += detail.Quantity;
            totalSales += detail.Quantity * detail.UnitPrice;
        }

        return {
            customerId,
            customerName: customer.CompanyName,
            totalOrders: orders.length,
            totalItems,
            totalSales,
        };
    });
    //-------------------------------------------------------------------------------

    // Product Sales Summary
    this.on("getProductSales", async (req) => {
        const { productId } = req.data;

        const product = await Northwind.run(
            SELECT.one.from("Northwind.Products").where({ ProductID: productId }),
        );

        if (!product) return req.error(404, `Product ${productId} not found`);


        const details = await Northwind.run(
            SELECT.from("Northwind.Order_Details").where({ ProductID: productId }),
        );

        const orderIds = new Set();
        let totalQuantity = 0;
        let totalRevenue = 0;

        for (const detail of details) {
            orderIds.add(detail.OrderID);
            totalQuantity += detail.Quantity;
            totalRevenue += detail.Quantity * detail.UnitPrice;
        }

        return {
            productId,
            productName: product.ProductName,
            totalOrders: orderIds.size,
            totalQuantity,
            totalRevenue,
        };
    });
    //---------------------------------------------------------------------------------------------------

    // Employee Sales performance Handler: tells us How well is this salesperson performing?
    this.on("getEmployeeSalesPerformance", async (req) => {
        const { employeeId } = req.data;

        const tx = cds.tx(req);

        const localEmployee = await tx.run(
            SELECT.one.from(SalesUser).where({ northwindEmployeeId: employeeId })
        )

        // SalesManager can't get performance of SalesAdmin.
        if (localEmployee.role === 'SalesAdmin' && req.user.is('SalesManager') && !req.user.is('SalesAdmin')) {
            return req.reject(403, 'You are not authorized to view SalesAdmin performance');
        }




        const employee = await Northwind.run(
            SELECT.one.from("Northwind.Employees").where({ EmployeeID: localEmployee.northwindEmployeeId })
        );

        if (!employee) return req.reject(404, 'Employee Not found');




        const order = await Northwind.run(
            SELECT.from('Northwind.Orders').where({ EmployeeID: employee.EmployeeID })
        )

        const orderIds = order.map((order) => order.OrderID);

        if (orderIds.length === 0) {
            return {
                employeeId: employee.EmployeeID,
                employeeName: employee.FirstName + " " + employee.LastName,
                totalOrders: 0,
                totalItems: 0,
                totalRevenue: 0,
            };
        }
        const details = await Northwind.run(
            SELECT.from("Northwind.Order_Details").where({ OrderID: { in: orderIds } })
        );

        let totalRevenue = 0;
        let totalItems = 0;

        for (const detail of details) {
            totalItems += detail.Quantity;
            totalRevenue += detail.Quantity * detail.UnitPrice;
        }

        return {
            employeeId: employee.EmployeeID,
            employeeName: (employee.FirstName + " " + employee.LastName),
            totalOrders: order.length,
            totalItems: totalItems,
            totalRevenue: totalRevenue,
        }

    });
    //---------------------------------------------------------------------------------------------------------

    // Dashboard Handler
    this.on('getDashboard', async (req) => {

        const tx = cds.tx(req);

        const isAdmin = req.user.is('SalesAdmin');
        const isManager = req.user.is('SalesManager');

        let employeePerformance = [];

        // Get employees according to logged-in user's role
        let employees;

        if (isAdmin) {
            // Admin : SalesUsers + SalesManagers
            employees = await tx.run(
                SELECT.from(SalesUser)
                    .where({
                        role: { in: ['SalesUser', 'SalesManager'] }
                    })
            );

        } else if (isManager) {
            // Manager : SalesUsers + SalesManagers
            employees = await tx.run(

                SELECT.from(SalesUser)
                    .where({
                        role: { in: ['SalesUser', 'SalesManager'] }
                    })
            );

        } else {
            const localEmployee = await tx.run(
                SELECT.one.from(SalesUser)
                    .where({ username: req.user.id })
            );

            if (!localEmployee) {
                return req.reject(404, 'SalesUser mapping not found');
            }

            employees = [localEmployee];
        }

        // Employee performance

        for (const localEmployee of employees) {

            const employee = await Northwind.run(
                SELECT.one.from('Northwind.Employees')
                    .where({
                        EmployeeID: localEmployee.northwindEmployeeId
                    })
            );

            if (!employee) continue;

            const orders = await Northwind.run(
                SELECT.from('Northwind.Orders')
                    .where({
                        EmployeeID: employee.EmployeeID
                    })
            );

            const orderIds = orders.map(order => order.OrderID);

            let totalItems = 0;
            let totalRevenue = 0;

            if (orderIds.length > 0) {

                const details = await Northwind.run(
                    SELECT.from('Northwind.Order_Details')
                        .where({
                            OrderID: { in: orderIds }
                        })
                );

                for (const detail of details) {
                    totalItems += detail.Quantity;
                    totalRevenue += detail.Quantity * detail.UnitPrice;
                }
            }

            employeePerformance.push({
                employeeId: employee.EmployeeID,
                employeeName: employee.FirstName + ' ' + employee.LastName,
                totalOrders: orders.length,
                totalItems: totalItems,
                totalRevenue: totalRevenue
            });
        }

        return {
            employeePerformance: employeePerformance,
            topCustomers: [],
            topProducts: []
        };
    });
    //--------------------------------------------------------------------------------------------------------



});
