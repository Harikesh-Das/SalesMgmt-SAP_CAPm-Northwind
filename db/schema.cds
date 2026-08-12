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
