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
        },
        
        formatPublishedYear(oReleaseDate) {
            const bDateIsValid = (oReleaseDate instanceof Date) && !Number.isNaN(oReleaseDate.getTime());
            return `${this.getText("published")}: ${bDateIsValid ? oReleaseDate.getFullYear() : this.getText("unknown")}`;
        },

        formatDate(oDate) {
            let oParsedDate;
            if (oDate instanceof Date) {
                oParsedDate = oDate;
            } else if (typeof oDate === "string") {
                oParsedDate = new Date(oDate);
            } else {
                oParsedDate = null;
            }

            const bDateIsValid = oParsedDate instanceof Date && !Number.isNaN(oParsedDate.getTime());
            return bDateIsValid
                ? oParsedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : this.getText("unknown");
        }
        
    });
});
