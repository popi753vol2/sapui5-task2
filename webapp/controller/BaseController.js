sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("project.controller.BaseController", {
        getModel(sName) {
            return this.getView().getModel(sName);
        },
        getText(sKey, aArgs) {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(sKey, aArgs);
        },
        generateBookId() {
            const aBooks = this.getModel().getProperty("/books") || [];
            const iNextId = aBooks.reduce((iMaxId, oBook) => {
                const iBookId = Number.parseInt(oBook.ID, 10);
                return  Math.max(iMaxId, iBookId);
            }, 0) + 1;

            return String(iNextId);
        }
    });
});
