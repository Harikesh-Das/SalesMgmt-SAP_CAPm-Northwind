namespace salesmgmt;

using {managed} from '@sap/cds/common';

/* Custom types */

type SalesUserRole : String enum {
    SalesUser;
    SalesManager;
    SalesAdmin;
}

//---------------------------------------------------------

/* Entities Declaration */

entity SalesUser : managed {
    key ID : UUID;
    name: String(40) not null;
    email: String(45) not null;
    role: SalesUserRole not null default 'user'

}
