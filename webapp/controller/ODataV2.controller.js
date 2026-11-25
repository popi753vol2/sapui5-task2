sap.ui.define([
    "project/controller/BaseController",
    "project/controller/AddProductDialog.controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
],
    (BaseController, AddProductDialog, JSONModel, MessageBox, MessageToast) => {
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
            async openDialog() {
                if (!this._addProductDialog) {
                    this._addProductDialog = AddProductDialog.create(this.getView());
                }

                await this._addProductDialog.open();
            }

        });
    });