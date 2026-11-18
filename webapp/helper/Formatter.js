sap.ui.define([], function () {
    "use strict";

    return {
        formatPublishedYear(oReleaseDate) {
            const bDateIsValid = (oReleaseDate instanceof Date) && !Number.isNaN(oReleaseDate.getTime());
            const sYear = bDateIsValid ? oReleaseDate.getFullYear() : this.getText("unknown");
            return this.getText("published", [sYear]);
        }
    };
});