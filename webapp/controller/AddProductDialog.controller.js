sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/library",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox"
], function (JSONModel, MessageToast, coreLibrary, Fragment, MessageBox) {
    "use strict";
    const ValueState = coreLibrary.ValueState;

    return {
        create(oView) {
            let oDialog;

            const oBundle = oView.getModel("i18n").getResourceBundle();
            const oDataV2Model = oView.getModel("odataV2");

            const oDialogController = {

                onSaveNewProduct() {
                    const oNewProductModel = oDialog.getModel("newProduct");
                    const oData = oNewProductModel.getData();

                    const sName = oData.Name.trim();
                    const sDescription = oData.Description.trim();
                    const oReleaseDate = oData.ReleaseDate;
                    const oDiscontinuedDate = oData.DiscontinuedDate;

                    const sRating = String(oData.Rating).trim();
                    const iRating = Number(sRating);
                    const sPrice = String(oData.Price).trim();
                    const iPrice = Number(sPrice);

                    const sCategory = String(oData.Category || "").trim();
                    const iCategoryId = Number(sCategory);
                    const sSupplier = String(oData.Supplier || "").trim();
                    const iSupplierId = Number(sSupplier);

                    const bReleaseDateIsValid = oReleaseDate instanceof Date;
                    const bDiscontinuedDateIsValid = oDiscontinuedDate instanceof Date;

                    const bValidDates = oReleaseDate < oDiscontinuedDate;

                    const aValidation = [
                        ["Name", Boolean(sName), "addFieldRequired"],
                        ["Description", Boolean(sDescription), "addFieldRequired"],
                        ["ReleaseDate", bReleaseDateIsValid, "addFieldRequired"],
                        ["ReleaseDate", bValidDates, "addDateInvalid"],
                        ["DiscontinuedDate", bDiscontinuedDateIsValid, "addFieldRequired"],
                        ["DiscontinuedDate", bValidDates, "addDateInvalid"],
                        ["Rating", Boolean(sRating) && Number.isInteger(iRating) && iRating >= 0, "addFieldRequired"],
                        ["Price", Boolean(sPrice) && !isNaN(iPrice) && iPrice >= 0, "addFieldRequired"],
                        ["Category", Boolean(sCategory) && Number.isInteger(iCategoryId), "addFieldRequired"],
                        ["Supplier", Boolean(sSupplier) && Number.isInteger(iSupplierId), "addFieldRequired"]
                    ];
                    const oValidation = {};
                    let bIsValid = true;

                    aValidation.forEach(([sField, bFieldValid, sErrorKey]) => {
                        oValidation[sField] = {
                            valueState: bFieldValid ? ValueState.None : ValueState.Error,
                            valueStateText: bFieldValid ? "" : oBundle.getText(sErrorKey)
                        };

                        bIsValid = bIsValid && bFieldValid;
                    });
                    oNewProductModel.setProperty("/validation", oValidation);

                    const sCategoryPath = oDataV2Model.createKey("/Categories", { ID: iCategoryId });
                    const sSupplierPath = oDataV2Model.createKey("/Suppliers", { ID: iSupplierId });

                    const category = oDataV2Model.getProperty(sCategoryPath);
                    const supplier = oDataV2Model.getProperty(sSupplierPath);

                    if (!bIsValid || !category.ID || !supplier.ID) {
                        MessageBox.error(oBundle.getText("addValidationMessage", [oBundle.getText("product")]));
                        return;
                    }

                    oDataV2Model.create("/Products", {
                        Name: sName,
                        Description: sDescription,
                        ReleaseDate: oReleaseDate,
                        DiscontinuedDate: oDiscontinuedDate,
                        Rating: iRating,
                        Price: iPrice,
                        Category: {
                            ...category
                        },
                        Supplier: {
                            ...supplier
                        }
                    }, {
                        success: () => {
                            MessageToast.show(oBundle.getText("addRecordsSuccess", [oBundle.getText("product")]));
                            oDialog.close();
                        },
                        error: (oError) => {
                            MessageBox.error(
                                oError && oError.message ||
                                oBundle.getText("addRecordsFailed", [oBundle.getText("product")])
                            );
                        }
                    });
                },

                onCancelAddProduct() {
                    oDialog?.close();
                }
            };

            return {
                async open() {
                    if (!oDialog) {
                        oDialog = await Fragment.load({
                            name: "project.view.fragments.AddProductDialogV2",
                            controller: oDialogController
                        });
                        oView.addDependent(oDialog);
                    }

                    oDialog.setModel(new JSONModel({
                        Name: "",
                        Description: "",
                        ReleaseDate: "",
                        DiscontinuedDate: "",
                        Rating: NaN,
                        Price: NaN,
                        Category: "",
                        Supplier: "",
                        validation: {}
                    }), "newProduct");
                    this.clearAddProductValidation();
                    oDialog.open();
                    return oDialog;
                },

                clearAddProductValidation() {
                    const oValidation = {};
                    ["Name", "Description", "ReleaseDate", "DiscontinuedDate", "Rating", "Price", "Category", "Supplier"].forEach((sField) => {
                        oValidation[sField] = {
                            valueState: ValueState.None,
                            valueStateText: ""
                        };
                    });
                    oDialog.getModel("newProduct").setProperty("/validation", oValidation);
                }

            };
        }
    };
});
