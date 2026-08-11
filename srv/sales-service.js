import cds from '@sap/cds';

export default cds.service.impl(async function () {

    /* Connect to External Service */
    const Northwind = await cds.connect.to('Northwind');
//--------------------------------------------------------------------------------------------------

    /* Get the entities from external service */
    const {
        Products,
        Customers,
        Orders,
        OrderDetails
    } = this.entities;
//--------------------------------------------------------------------------------------------------------

    // READ requests handler to Northwind
    this.on('READ', [
        Products,
        this.entities.Categories,
        Customers,
        Orders,
        OrderDetails,
        this.entities.Employees,
        this.entities.Suppliers
    ], async (req) => {

        return Northwind.tx(req).run(req.query);

    });
//-------------------------------------------------------------------------------------

    // Customer Sales Summary Handler
    this.on('getCustomerSalesSummary', async (req) => {

        const { customerId } = req.data;

        const customer = await Northwind.run(
            SELECT.one
                .from('Northwind.Customers')
                .where({ CustomerID: customerId })
        );

        if (!customer) {
            return req.error(404, `Customer ${customerId} not found`);
        }

        const orders = await Northwind.run(
            SELECT.from('Northwind.Orders')
                .where({ CustomerID: customerId })
        );

        const orderIds = orders.map(order => order.OrderID);

        if (orderIds.length === 0) {
            return {
                customerId,
                customerName: customer.CompanyName,
                totalOrders: 0,
                totalItems: 0,
                totalSales: 0
            };
        }

        const details = await Northwind.run(
            SELECT.from('Northwind.Order_Details')
                .where({ OrderID: { in: orderIds } })
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
            totalSales
        };
    });
//-------------------------------------------------------------------------------

    // Product Sales Summary
    this.on('getProductSales', async (req) => {

        const { productId } = req.data;

        const product = await Northwind.run(
            SELECT.one
                .from('Northwind.Products')
                .where({ ProductID: productId })
        );

        if (!product) {
            return req.error(404, `Product ${productId} not found`);
        }

        const details = await Northwind.run(
            SELECT.from('Northwind.Order_Details')
                .where({ ProductID: productId })
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
            totalRevenue
        };
    });
//---------------------------------------------------------------------------------------------------

});