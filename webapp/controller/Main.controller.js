sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], (Controller, JSONModel) => {
    "use strict";

    return Controller.extend("project.controller.Main", {
        onInit() {
            const oBookModel = new JSONModel({
                books: [
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
                ]
            });

            this.getView().setModel(oBookModel);
        }
    });
});