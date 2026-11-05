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
            const randomId = Math.floor(Math.random() * 10000).toString();
            const bDuplicateId = this.getModel().getProperty("/books")
                .some((oBook) => oBook.ID.toLowerCase() === randomId.toLowerCase());
            if (bDuplicateId) {
                return this.generateBookId();
            }
            return randomId;
        },
    });
});
