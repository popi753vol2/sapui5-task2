sap.ui.define([
    "project/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/library",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
],
    (BaseController, JSONModel, coreLibrary, MessageBox, MessageToast) => {

        const ValueState = coreLibrary.ValueState;


        return BaseController.extend("project.controller.ODataV2", {

            onInit() {
                this.getView().setModel(new JSONModel({
                    hasSelection: false,
                    isDeleting: false,
                    selectedCategoryId: "",
                    selectedSupplierId: "",
                    validation: {}
                }), "odataV2Ui");
            },

            onSelectionChange(oEvent) {
                this.updateSelectionState(oEvent.getSource());
            },

            onDeleteRecord(oEvent) {
                const oTable = oEvent.getSource().getParent().getParent();
                const aSelectedContexts = oTable.getSelectedContexts();

                if (!aSelectedContexts.length) {
                    MessageToast.show(this.getText("noSelectionMessage"));
                    return;
                }

                const sYes = this.getText("yes");
                const sNo = this.getText("no");
                MessageBox.confirm(this.getText("deleteConfirmationMessage"), {
                    title: this.getText("deleteConfirmationTitle"),
                    actions: [sYes, sNo],
                    emphasizedAction: sYes,
                    onClose: (sAction) => {
                        if (sAction === sYes) {
                            this.onDeleteSelectedRecords(oTable, aSelectedContexts);
                        }
                    }
                });
            },

            onDeleteSelectedRecords(oTable, aSelectedContexts) {
                const oModelUi = this.getModel("odataV2Ui");
                oModelUi.setProperty("/isDeleting", true);
                const oModel = this.getModel("odataV2");
                const iSelectedLength = aSelectedContexts.length;

                if (!iSelectedLength) {
                    oModelUi.setProperty("/isDeleting", false);
                    this.updateSelectionState(oTable);
                    MessageToast.show(this.getText("noSelectionMessage"));
                    return;
                }

                let iCompleted = 0;
                let iSuccessCount = 0;
                let iErrorCount = 0;
                let oFirstError = null;

                aSelectedContexts.forEach((oContext) => {
                    oModel.remove(oContext.getPath(), {
                        success: () => {
                            iSuccessCount++;
                            iCompleted++;
                            if (iCompleted === iSelectedLength) {
                                this.finalizeDelete(oTable, iSuccessCount, iErrorCount, oFirstError);
                            }
                        },
                        error: (oError) => {
                            iErrorCount++;
                            iCompleted++;
                            oFirstError = oFirstError || oError;
                            if (iCompleted === iSelectedLength) {
                                this.finalizeDelete(oTable, iSuccessCount, iErrorCount, oFirstError);
                            }
                        }
                    });
                });
            },

            finalizeDelete(oTable, iSuccessCount, iErrorCount, oFirstError) {
                this.getModel("odataV2Ui").setProperty("/isDeleting", false);

                if (iErrorCount === 0) {
                    oTable.removeSelections(true);
                    MessageToast.show(this.getText("deleteRecordsSuccess"));
                } else {
                    if (iSuccessCount > 0) {
                        this.getModel("odataV2").refresh(true);
                    }
                    MessageBox.error(
                        oFirstError && oFirstError.message ||
                        this.getText("deleteRecordsFailed")
                    );
                }
                this.updateSelectionState(oTable);
            },

            updateSelectionState(oTable) {
                const oModel = this.getModel("odataV2Ui");
                const aSelectedContexts = oTable.getSelectedContexts();
                oModel.setProperty(
                    "/hasSelection",
                    aSelectedContexts.length > 0
                );
            },

            async openDialog() {
                const oDataV2Model = this.getModel("odataV2");

                if (!this.oDialog) {
                    this.oDialog = await this.loadFragment({
                        name: "project.view.fragments.AddProductDialogV2"
                    });
                }

                const oProductContext = oDataV2Model.createEntry("/Products", {
                    expand: "Category,Supplier",
                    properties: {
                        Name: "asdf",
                        Description: "adsf",
                        ReleaseDate: new Date(121212),
                        DiscontinuedDate: new Date(),
                        Rating: 231,
                        Price: 3412

                    },
                    success: () => {
                        MessageToast.show(this.getText("addRecordsSuccess", [this.getText("product")]));
                        this.oDialog.setBindingContext(null, "odataV2");
                        this.oDialog.close();
                    },
                    error: (oError) => {
                        MessageBox.error(
                            oError && oError.message ||
                            this.getText("addRecordsFailed", [this.getText("product")])
                        );
                    }
                });
                this.oDialog.setBindingContext(oProductContext, "odataV2");
                const oUiModel = this.getModel("odataV2Ui");
                oUiModel.setProperty("/selectedCategoryId", "");
                oUiModel.setProperty("/selectedSupplierId", "");
                this.clearAddProductValidation();
                this.oDialog.open();
            },

            clearAddProductValidation() {
                const oValidation = {};
                ["Name", "Description", "ReleaseDate", "DiscontinuedDate", "Rating", "Price", "Category", "Supplier"].forEach((sField) => {
                    oValidation[sField] = {
                        valueState: ValueState.None,
                        valueStateText: ""
                    };
                });
                this.getModel("odataV2Ui").setProperty("/validation", oValidation);
            },

            onSaveNewProduct() {
                const oDataV2Model = this.getModel("odataV2");
                const oProductContext = this.oDialog.getBindingContext("odataV2");
                if (!oProductContext) {
                    MessageBox.error(this.getText("addRecordsFailed", [this.getText("product")]));
                    return;
                }
                const oData = oProductContext.getObject();
                const oUiModel = this.getModel("odataV2Ui");

                const sName = oData.Name.trim();
                const sDescription = oData.Description.trim();
                const oReleaseDate = oData.ReleaseDate;
                const oDiscontinuedDate = oData.DiscontinuedDate;

                const sRating = String(oData.Rating).trim();
                const iRating = Number(sRating);
                const sPrice = String(oData.Price).trim();
                const iPrice = Number(sPrice);

                const sCategory = String(oUiModel.getProperty("/selectedCategoryId") || "").trim();
                const iCategoryId = Number(sCategory);
                const sSupplier = String(oUiModel.getProperty("/selectedSupplierId") || "").trim();
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
                        valueStateText: bFieldValid ? "" : this.getText(sErrorKey)
                    };

                    bIsValid = bIsValid && bFieldValid;
                });
                oUiModel.setProperty("/validation", oValidation);

                if (!bIsValid) {
                    MessageBox.error(this.getText("addValidationMessage", [this.getText("product")]));
                    return;
                }

                const sCategoryPath = oDataV2Model.createKey("/Categories", { ID: iCategoryId });
                const sSupplierPath = oDataV2Model.createKey("/Suppliers", { ID: iSupplierId });

                const oCategory = oDataV2Model.getProperty(sCategoryPath);
                const oSupplier = oDataV2Model.getProperty(sSupplierPath);

                if (!oCategory || !oSupplier) {
                    MessageBox.error(this.getText("addValidationMessage", [this.getText("product")]));
                    return;
                }

                oProductContext.setProperty("Category", oCategory);
                oProductContext.setProperty("Supplier", oSupplier);

                oDataV2Model.submitChanges();
            },

            onCancelAddProduct() {
                const oProductContext = this.oDialog?.getBindingContext("odataV2");
                if (oProductContext) {
                    this.getModel("odataV2").deleteCreatedEntry(oProductContext);
                    this.oDialog.setBindingContext(null, "odataV2");
                }
                this.oDialog?.close();
            }

        });
    });