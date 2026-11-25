sap.ui.define([], function () {
    "use strict";

    return {
        formatPublishedYear(oReleaseDate) {
            const bDateIsValid = (oReleaseDate instanceof Date) && !Number.isNaN(oReleaseDate.getTime());
            const sYear = bDateIsValid ? oReleaseDate.getFullYear() : this.getText("unknown");
            return this.getText("published", [sYear]);
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
    };
});