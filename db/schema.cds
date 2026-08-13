namespace salesmgmt;

using {managed} from '@sap/cds/common';

/* Custom types */

type SalesUserRole : String enum {
    SalesUser;
    SalesManager;
    SalesAdmin;
}

type Username      : String enum {
    user;
    manager;
    admin;
};


//---------------------------------------------------------

/* Entities Declaration */

entity SalesUser : managed {
    key ID                  : UUID;
        username            : Username not null default 'user';
        role                : SalesUserRole not null default 'SalesUser';
        northwindEmployeeId : Integer;

}

entity SupplierPurchase : managed {
    key ID: UUID;
    supplierId: Integer;
    productId: Integer;
    quantity: Integer;
    unitCost: Decimal (10,2);
    purchaseDate: Date;
}
