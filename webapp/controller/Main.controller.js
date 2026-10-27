sap.ui.define([
    "project/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], (BaseController, Filter, FilterOperator, JSONModel, MessageToast) => {
    "use strict";

    return BaseController.extend("project.controller.Main", {
        onInit() {
            const aBooks = [
                {
                    ID: "B001",
                    Name: "The Hobbit",
                    Author: "J.R.R. Tolkien",
                    Genre: "Fantasy",
                    ReleaseDate: new Date(1937, 8, 21),
                    AvailableQuantity: 4
                },
                {
                    ID: "B002",
                    Name: "Pride and Prejudice",
                    Author: "Jane Austen",
                    Genre: "Romance",
                    ReleaseDate: new Date(1813, 0, 28),
                    AvailableQuantity: 7
                },
                {
                    ID: "B003",
                    Name: "1984",
                    Author: "George Orwell",
                    Genre: "Dystopian",
                    ReleaseDate: new Date(1949, 5, 8),
                    AvailableQuantity: 3
                },
                {
                    ID: "B004",
                    Name: "The Great Gatsby",
                    Author: "F. Scott Fitzgerald",
                    Genre: "Classic",
                    ReleaseDate: new Date(1925, 3, 10),
                    AvailableQuantity: 5
                },
                {
                    ID: "B005",
                    Name: "To Kill a Mockingbird",
                    Author: "Harper Lee",
                    Genre: "Fiction",
                    ReleaseDate: new Date(1960, 6, 11),
                    AvailableQuantity: 2
                },
                {
                    ID: "B006",
                    Name: "The Name of the Rose",
                    Author: "Umberto Eco",
                    Genre: "Mystery",
                    ReleaseDate: new Date(1980, 0, 1),
                    AvailableQuantity: 6
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
        },

        onSelectionChange(oEvent) {
            this.byId("deleteRecordButton").setEnabled(oEvent.getSource().getSelectedItems().length > 0);
        },

        onAddRecord() {
            const oModel = this.getModel();
            const aBooks = oModel.getProperty("/books");

            oModel.setProperty("/books", aBooks.concat({
                ID: "",
                Name: "",
                Author: "",
                Genre: "",
                ReleaseDate: null,
                AvailableQuantity: null
            }));
        },

        onDeleteRecord(oEvent) {
            const oTable = oEvent.getSource().getParent().getParent();
            const aSelectedContexts = oTable.getSelectedContextPaths();

            if (!aSelectedContexts.length) {
                return MessageToast.show(this.getText("noSelectionMessage"));
            }

            const oModel = this.getModel();

            const aBooks = oModel.getProperty("/books")
                .filter((_oBook, iIndex) => !aSelectedContexts.includes("/books/" + iIndex));

            oModel.setProperty("/books", aBooks);
            oTable.removeSelections(true);
        },

        onFilterBooks() {
            const aFilters = [];
            const sTitle = this.byId("bookTitleFilter").getValue().trim();
            const sGenre = this.byId("bookGenreFilter").getSelectedKey();

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