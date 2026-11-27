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
                    isDeleting: false
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

            async onAddProduct() {
                this.openDialog();
            },

            async onEditProduct(oEvent) {
                const oProductContext = oEvent.getSource().getBindingContext("odataV2");
                await this.openDialog(oProductContext);
            },

            async openDialog(oProductContext) {
                const oDataV2Model = this.getModel("odataV2");

                if (!this.oDialog) {
                    this.oDialog = await this.loadFragment({
                        name: "project.view.fragments.AddProductDialogV2"
                    });

                    this.oDialog.setModel(new JSONModel({
                        selectedCategoryId: oProductContext ? String(oProductContext.getProperty("Category/ID") || "") : "",
                        selectedSupplierId: oProductContext ? String(oProductContext.getProperty("Supplier/ID") || "") : "",
                        bEditMode: Boolean(oProductContext),
                        validation: {}
                    }), "odataV2DialogUi");
                }

                this.oDialog.getModel("odataV2DialogUi").setData({
                    selectedCategoryId: oProductContext ? String(oProductContext.getProperty("Category/ID") || "") : "",
                    selectedSupplierId: oProductContext ? String(oProductContext.getProperty("Supplier/ID") || "") : "",
                    bEditMode: Boolean(oProductContext),
                    validation: {}
                });

                if (oProductContext) {
                    this.oDialog.setBindingContext(oProductContext, "odataV2");
                } else {
                    const oDialogProductContext = oDataV2Model.createEntry("/Products", {
                        properties: {
                            Name: "",
                            Description: "",
                            ReleaseDate: "",
                            DiscontinuedDate: "",
                            Rating: NaN,
                            Price: NaN
                        }
                    });
                    this.oDialog.setBindingContext(oDialogProductContext, "odataV2");

                }

                this.oDialog.open();
            },

            onSaveProduct() {
                const oDataV2Model = this.getModel("odataV2");
                const oProductContext = this.oDialog.getBindingContext("odataV2");
                if (!oProductContext) {
                    MessageBox.error(this.getText("saveRecordsFailed", [this.getText("product")]));
                    return;
                }
                const oData = oProductContext.getObject();
                const oUiModel = this.oDialog.getModel("odataV2DialogUi");

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
                    ["Name", Boolean(sName), "fieldRequired"],
                    ["Description", Boolean(sDescription), "fieldRequired"],
                    ["ReleaseDate", bReleaseDateIsValid, "fieldRequired"],
                    ["ReleaseDate", bValidDates, "dateInvalid"],
                    ["DiscontinuedDate", bDiscontinuedDateIsValid, "fieldRequired"],
                    ["DiscontinuedDate", bValidDates, "dateInvalid"],
                    ["Rating", Boolean(sRating) && Number.isInteger(iRating) && iRating >= 0, "fieldRequired"],
                    ["Price", Boolean(sPrice) && !isNaN(iPrice) && iPrice >= 0, "fieldRequired"],
                    ["Category", Boolean(sCategory) && Number.isInteger(iCategoryId), "fieldRequired"],
                    ["Supplier", Boolean(sSupplier) && Number.isInteger(iSupplierId), "fieldRequired"]
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

                const sCategoryPath = oDataV2Model.createKey("/Categories", { ID: iCategoryId });
                const sSupplierPath = oDataV2Model.createKey("/Suppliers", { ID: iSupplierId });

                const oCategory = oDataV2Model.getProperty(sCategoryPath);
                const oSupplier = oDataV2Model.getProperty(sSupplierPath);

                if (!oCategory || !oSupplier || !bIsValid) {
                    MessageBox.error(this.getText("saveValidationMessage", [this.getText("product")]));
                    return;
                }

                oProductContext.setProperty("Category", oCategory);
                oProductContext.setProperty("Supplier", oSupplier);

                oDataV2Model.submitChanges({
                    success: () => {
                        MessageToast.show(this.getText("saveRecordsSuccess", [this.getText("product")]));
                        this.oDialog.setBindingContext(null, "odataV2");
                        this.oDialog.close();
                    },
                    error: (oError) => {
                        MessageBox.error(
                            oError && oError.message ||
                            this.getText("saveRecordsFailed", [this.getText("product")])
                        );
                    }
                });

                this.oDialog.setBindingContext(null, "odataV2");
                this.oDialog.close();
            },

            onCancelProduct() {
                const oProductContext = this.oDialog?.getBindingContext("odataV2");
                if (oProductContext) {
                    this.getModel("odataV2").deleteCreatedEntry(oProductContext);
                    this.oDialog.setBindingContext(null, "odataV2");
                }
                this.oDialog?.close();
            }

        });
    });