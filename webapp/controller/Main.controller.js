sap.ui.define([
    "project/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/library"
], (BaseController, Filter, FilterOperator, JSONModel, MessageToast, MessageBox, coreLibrary) => {
    "use strict";

    const ValueState = coreLibrary.ValueState;

    return BaseController.extend("project.controller.Main", {
        onInit() {
            const aBooks = [
                {
                    ID: "B001",
                    Name: "The Hobbit",
                    Author: "J.R.R. Tolkien",
                    Genre: "Fantasy",
                    ReleaseDate: new Date(1937, 8, 21),
                    AvailableQuantity: 4,
                    editMode: false
                },
                {
                    ID: "B002",
                    Name: "Pride and Prejudice",
                    Author: "Jane Austen",
                    Genre: "Romance",
                    ReleaseDate: new Date(1813, 0, 28),
                    AvailableQuantity: 7,
                    editMode: false
                },
                {
                    ID: "B003",
                    Name: "1984",
                    Author: "George Orwell",
                    Genre: "Dystopian",
                    ReleaseDate: new Date(1949, 5, 8),
                    AvailableQuantity: 3,
                    editMode: false
                },
                {
                    ID: "B004",
                    Name: "The Great Gatsby",
                    Author: "F. Scott Fitzgerald",
                    Genre: "Classic",
                    ReleaseDate: new Date(1925, 3, 10),
                    AvailableQuantity: 5,
                    editMode: false
                },
                {
                    ID: "B005",
                    Name: "To Kill a Mockingbird",
                    Author: "Harper Lee",
                    Genre: "Fiction",
                    ReleaseDate: new Date(1960, 6, 11),
                    AvailableQuantity: 2,
                    editMode: false
                },
                {
                    ID: "B006",
                    Name: "The Name of the Rose",
                    Author: "Umberto Eco",
                    Genre: "Mystery",
                    ReleaseDate: new Date(1980, 0, 1),
                    AvailableQuantity: 6,
                    editMode: false
                }
            ];

            const aGenres = Array.from(new Set(aBooks.map((oBook) => oBook.Genre)))
                .sort((sFirst, sSecond) => sFirst.localeCompare(sSecond))
                .map((sGenre) => ({
                    key: sGenre,
                    text: sGenre
                }));
            const oBookModel = new JSONModel({
                books: aBooks,
                genres: [
                    {
                        key: "",
                        text: this.getText("allGenres")
                    },
                    ...aGenres
                ]
            });

            this.getView().setModel(oBookModel);

            const oUiModel = new JSONModel({
                hasSelection: false,
                filters: {
                    title: "",
                    genre: ""
                }
            });

            this.getView().setModel(oUiModel, "ui");
        },

        onSelectionChange(oEvent) {
            this.getView().getModel("ui").setProperty(
                "/hasSelection",
                oEvent.getSource().getSelectedItems().length > 0
            );
        },

        onHandleAction(oEvent, bEdit) {
            const oContext = oEvent.getSource().getBindingContext();
            const sPath = oContext.getPath();
            const oModel = this.getModel();

            if (bEdit) {
                oModel.setProperty(sPath + "/editName", oContext.getProperty("Name"));
            } else {
                oModel.setProperty(sPath + "/Name", oContext.getProperty("editName"));
            }
            oModel.setProperty(sPath + "/editMode", bEdit);
        },

        async onAddRecord() {
            const oNewBookModel = new JSONModel({
                ID: "",
                Name: "",
                Author: "",
                Genre: "",
                ReleaseDate: "",
                AvailableQuantity: NaN
            });
            if (!this.oAddBookDialog) {
                this.oAddBookDialog = await this.loadFragment({
                    name: "project.view.fragments.AddBookDialog"
                });
            }

            this.oAddBookDialog.setModel(oNewBookModel, "newBook");
            this.clearAddBookValidation();
            this.oAddBookDialog.open();
        },

        clearAddBookValidation() {
            ["bookNameInput", "bookAuthorInput", "bookGenreInput",
                "bookReleaseDateInput", "bookQuantityInput"].forEach((sId) => {
                    const oControl = this.byId(sId);
                    oControl.setValueState(ValueState.None);
                    oControl.setValueStateText("");
                });
        },

        onSaveNewBook() {
            const oData = this.oAddBookDialog.getModel("newBook").getData();
            const sId = this.generateBookId();

            const sName = oData.Name.trim();
            const sAuthor = oData.Author.trim();
            const sGenre = oData.Genre.trim();
            const sQuantity = String(oData.AvailableQuantity).trim();
            const iQuantity = Number(sQuantity);
            const aReleaseDate = oData.ReleaseDate.split("-");
            const oReleaseDate = new Date(aReleaseDate[0], aReleaseDate[1] - 1, aReleaseDate[2]);

            const bReleaseDateIsValid = !isNaN(oReleaseDate);

            const aValidation = [
                ["bookNameInput", Boolean(sName), "addBookFieldRequired"],
                ["bookAuthorInput", Boolean(sAuthor), "addBookFieldRequired"],
                ["bookGenreInput", Boolean(sGenre), "addBookFieldRequired"],
                ["bookReleaseDateInput", bReleaseDateIsValid, "addBookFieldRequired"],
                ["bookQuantityInput", Boolean(sQuantity) && Number.isInteger(iQuantity) && iQuantity >= 0, "addBookQuantityInvalid"]
            ];
            let bIsValid = true;

            aValidation.forEach(([sControlId, bFieldValid, sErrorKey]) => {
                if (!bFieldValid) {
                    const oControl = this.byId(sControlId);
                    oControl.setValueState(ValueState.Error);
                    oControl.setValueStateText(this.getText(sErrorKey));
                    bIsValid = false;
                }
            });

            if (!bIsValid) {
                MessageBox.error(this.getText("addBookValidationMessage"));
                return;
            }

            const oBookModel = this.getModel();
            const aBooks = oBookModel.getProperty("/books");
            oBookModel.setProperty("/books", aBooks.concat({
                ID: sId,
                Name: sName,
                Author: sAuthor,
                Genre: sGenre,
                ReleaseDate: oReleaseDate,
                AvailableQuantity: iQuantity,
                editMode: false
            }));

            const aGenres = oBookModel.getProperty("/genres");
            if (!aGenres.some((oGenre) => oGenre.key === sGenre)) {
                const aSortedGenres = aGenres.slice(1).concat({ key: sGenre, text: sGenre })
                    .sort((oFirst, oSecond) => oFirst.text.localeCompare(oSecond.text));
                oBookModel.setProperty("/genres", [aGenres[0], ...aSortedGenres]);
            }

            this.oAddBookDialog.close();

        },

        onCancelAddBook() {
            this.oAddBookDialog.close();
        },

        onConfirmDelete(oEvent) {
            const oTable = oEvent.getSource().getParent().getParent();
            const aSelectedContexts = oTable.getSelectedContextPaths();

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
                        this.onDeleteSelected(oTable, aSelectedContexts);
                    }
                }
            });
        },

        onDeleteSelected(oTable, aSelectedContexts) {
            const oModel = this.getModel();
            const aBooks = oModel.getProperty("/books")
                .filter((_oBook, iIndex) => !aSelectedContexts.includes("/books/" + iIndex));

            oModel.setProperty("/books", aBooks);
            oTable.removeSelections(true);
        },

        onFilterBooks() {
            const aFilters = [];

            const oUiModel = this.getView().getModel("ui");
            const sTitle = oUiModel.getProperty("/filters/title").trim();
            const sGenre = oUiModel.getProperty("/filters/genre");

            if (sTitle) {
                aFilters.push(new Filter("Name", FilterOperator.Contains, sTitle));
            }

            if (sGenre) {
                aFilters.push(new Filter("Genre", FilterOperator.EQ, sGenre));
            }

            this.byId("booksTable").getBinding("items").filter(aFilters);
        }
    });
});