const Moment = require("moment");
const AbstractModel = require("./abstract");
const UserModel = require("./user");
const connection = require('./database');
const fs = require('fs');
var cloudinary = require('cloudinary');
var AuthorModel = require('./author');
var GenreModel = require('./genre');

cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.API_KEY, 
    api_secret: process.env.API_SECRET
});

class BookModel extends AbstractModel {
    constructor(params = {}) {
        super();
        this.id = params.id;
        this.name = params.name;
        this.price = params.price;
        this.author_id = params.author_id;
        this.genre_id = params.genre_id;
        this.image = params.image;
        this.sample_pdf = params.sample_pdf;
        this.published_date = params.published_date;
        this.description = params.description;
        this.created_user_id = params.created_user_id;
        this.updated_user_id = params.updated_user_id;
        this.deleted_user_id = params.deleted_user_id;
        this.created_at = params.created_at;
        this.updated_at = params.updated_at;
        this.deleted_at = params.deleted_at;
    }
    
    /**
     * convert to JSON
     */
    toJSON() {
        const clone = { ...this };

        return clone;
    }

    /**
     * create book
     */
    static async create(params, user) {
        const loginUser = await UserModel.getUserIdByToken(user.Authorization);

        const id = super.generateId();
        const name = params.name;
        const price = params.price;
        const author_id = params.author_id;
        const genre_id = params.genre_id;
        const published_date = params.published_date;
        const description = params.description;
        const created_user_id = loginUser.id;
        const updated_user_id = loginUser.id;
        const created_at = Moment().format();
        const updated_at = Moment().format();
        var img = "data:image/png;base64," + params.image;
        var uploadImage = await cloudinary.uploader.upload(img, function(result) { return result.url; });
        var pdfFile = "data:pdf/pdf;base64,"+ params.sample_pdf;
        var uploadPdf = await cloudinary.uploader.upload(pdfFile, function(result) { return result.url; });
        const image = uploadImage.url;
        const sample_pdf = uploadPdf.url;
        const itemParams = {
            id: id,
            name: name,
            price: price,
            author_id: author_id,
            genre_id: genre_id,
            image: image,
            sample_pdf: sample_pdf,
            published_date: published_date,
            description: description,
            created_user_id: created_user_id,
            updated_user_id: updated_user_id,
            created_at: created_at,
            updated_at: updated_at,
        }
        const query_str = `INSERT INTO books(id, name, price, author_id, genre_id, image, sample_pdf, published_date, description, created_user_id, updated_user_id, created_at, updated_at)
                         VALUES ('${id}', '${name}', '${price}','${author_id}', '${genre_id}', '${image}', '${sample_pdf}', '${published_date}', '${description}', '${created_user_id}','${updated_user_id}','${created_at}','${updated_at}')`;
        const result = connection.query(query_str);
        if (result) {
            console.log("INSERT SUCCESSFULY");
        } else {
            console.log("INSERTING FAIL");
        }

        return this.toModel(itemParams);
    }

    /**
     * Get book with ID.
     */
    static async getById(bookId) {
        const result = await this._getById(bookId);
        
        var authorResult = await AuthorModel.getAll();
        var genreResult = await GenreModel.getAll();
        for (var res in result ) {
            for(var authorRes in authorResult) {
                if ( result[res].author_id == authorResult[authorRes].id ) {
                    result[res].author_id = authorResult[ authorRes ].name;
                    
                }
            }

            for(var genreRes in genreResult) {
                if ( result[res].genre_id == genreResult[genreRes].id ) {
                    result[res].genre_id = genreResult[ genreRes ].name;
                }
            }
        }

        const items = result.map(model => {       

            return this.toModel(model);
        })

        return items[0];
    }

    /**
     * Acquire book with ID.
     * @param {string} bookId
     * @return {Object|null}
     */
    static async _getById(bookId) {
        var result = await connection.query(`SELECT *
        FROM books
        WHERE id ='${bookId}'`);
        
        return result;
    }

    /**
    * Get pdf.
    */
    static async getPdf(bookId) {
        const item = await this._getPdf(bookId);
        
        return item[0].sample_pdf;
    }

    /**
     * Acquire book with ID.
     * @param {string} bookId
     * @return {Object|null}
     */
    static async _getPdf(bookId) {
        var result = await connection.query(`SELECT sample_pdf
        FROM books
        WHERE id ='${bookId}'`);
        
        return result;
    }

    /**
     * Acquire book with Name
     */
    static async getByName(params) {
        const item = await this._getByName(params);
        const items = item.map(model => {

            return this.toModel(model)
        })

        return items;
    }

    /**
     * Acquire book with Name.
     * @param {string} bookName
     * @return {Object|null}
     */
    static async _getByName(bookName) {
        var result = await connection.query(`SELECT *
        FROM books
        WHERE name ='${bookName}'`);

        return result;
    }

    /**
     * get all books
     * @return {Array.<Object>}
     */
    static async getAll(queryParam) {
        if( queryParam == null) {
            queryParam = {};
        }      
        const item = await BookModel._getAll(queryParam);
        const items = item.map(model => { 
            return this.toModel(model);
        });
        
        return items;
    }

    /**
     * get all books
     */
    static async _getAll(queryParam) {
        var result;
        var attributeOne, attributeTwo, attributeThree;
        var paramOne, paramTwo, paramThree;
        var objKey = Object.keys(queryParam);
        var objValue = Object.values(queryParam);
        var authorResult = await AuthorModel.getAll();
        var genreResult = await GenreModel.getAll();

        switch(objKey.length) {
            case 1: {
                attributeOne = objKey[0];
                paramOne = objValue[0];
                result = await connection.query(`SELECT * FROM books WHERE  ${attributeOne} = '${paramOne}'`);
                for (var res in result ) {
                    for(var authorRes in authorResult) {
                        if ( result[res].author_id == authorResult[authorRes].id ) {
                            result[res].author_id = authorResult[ authorRes ].name;
                            
                        }
                    }

                    for(var genreRes in genreResult) {
                        if ( result[res].genre_id == genreResult[genreRes].id ) {
                            result[res].genre_id = genreResult[ genreRes ].name;
                        }
                    }
                }
                break;
            }
            case 2: {
                attributeOne = objKey[0];
                paramOne = objValue[0];
                attributeTwo = objKey[1];
                paramTwo = objValue[1];
                result = await connection.query(`SELECT * FROM books WHERE  ${attributeOne} = '${paramOne}' AND ${attributeTwo} = '${paramTwo}'`);
                for (var res in result ) {
                    for(var authorRes in authorResult) {
                        if ( result[res].author_id == authorResult[authorRes].id ) {
                            result[res].author_id = authorResult[ authorRes ].name;
                        }
                    }

                    for(var genreRes in genreResult) {
                        if ( result[res].genre_id == genreResult[genreRes].id ) {
                            result[res].genre_id = genreResult[ genreRes ].name;
                        }
                    }
                }
                break;
            }
            case 3: {
                attributeOne = objKey[0];
                paramOne = objValue[0];
                attributeTwo = objKey[1];
                paramTwo = objValue[1];
                attributeThree = objKey[2];
                paramThree = objValue[2];
                result = await connection.query(`SELECT * FROM books WHERE  ${attributeOne} = '${paramOne}' AND ${attributeTwo} = '${paramTwo}' AND ${attributeThree} = '${paramThree}'`);
                for (var res in result ) {
                    for(var authorRes in authorResult) {
                        if ( result[res].author_id == authorResult[authorRes].id ) {
                            result[res].author_id = authorResult[ authorRes ].name;
                        }
                    }

                    for(var genreRes in genreResult) {
                        if ( result[res].genre_id == genreResult[genreRes].id ) {
                            result[res].genre_id = genreResult[ genreRes ].name;
                        }
                    }
                }
                break;
            }
            default: {
                result = await connection.query(`SELECT * FROM books`);
                for (var res in result ) {
                    for(var authorRes in authorResult) {
                        if ( result[res].author_id == authorResult[authorRes].id ) {
                            result[res].author_id = authorResult[ authorRes ].name;
                        }
                    }

                    for(var genreRes in genreResult) {
                        if ( result[res].genre_id == genreResult[genreRes].id ) {
                            result[res].genre_id = genreResult[ genreRes ].name;
                        }
                    }
                }
            }
        }
        
        return result;
    }

    /**
     * update book
     * @param {Object}
     * @return {Object}
     */
    static async update(params, user) {
        const loginUser = await UserModel.getUserIdByToken(user.token);
        const book = await this.getById(params.bookId);
        const id = params.bookId;
        const name = params.name;
        const price = params.price;
        const author_id = params.author_id;
        const genre_id = params.genre_id;
        const published_date = params.published_date;
        const description = params.description;
        const created_user_id = book.created_user_id;
        const updated_user_id = loginUser.id;
        const created_at = book.created_at;
        const updated_at = Moment().format();
        const imageFilePath = book.image;
        const pdfFilePath = book.sample_pdf;
        var image;
        var sample_pdf;
        var uploadImage;
        if( params.image != "" && params.image != null && params.image != undefined ) {
            if( params.image != imageFilePath ) {
                var img = "data:image/png;base64," + params.image;
                var uploadImage = await cloudinary.uploader.upload(img, function(result) { return result.url; });
                const firstSplitVar = imageFilePath.split("/");
                const secondSplitVar = firstSplitVar[7].split(".");
                
                var deleteImage = await cloudinary.uploader.destroy(secondSplitVar[0], function(result) { console.log(result) });
                
                image = uploadImage.url;
            } else {
                image = imageFilePath;
            }
            
        } else {
            image = "";
        }

        if( params.sample_pdf != "" && params.sample_pdf != null && params.sample_pdf != undefined) {
            if( params.sample_pdf != pdfFilePath ) {
                var pdf = "data:pdf/pdf;base64," + params.sample_pdf;
                var uploadPdf = await cloudinary.uploader.upload(pdf, function(result) { return result.url; });
                const firstSplitVar1 = pdfFilePath.split("/");
                const secondSplitVar2 = firstSplitVar1[7].split(".");

                var deletePdf = await cloudinary.uploader.destroy(secondSplitVar2[0], function(result) { console.log(result) });

                sample_pdf = uploadPdf.url;   

            } else {
                sample_pdf = pdfFilePath;
            }
        } else {
            sample_pdf = "";
        }
        
        const itemParams = {
            id: id,
            name: name,
            price: price,
            author_id: author_id,
            genre_id: genre_id,
            image: image,
            sample_pdf: sample_pdf,
            published_date: published_date,
            description: description,
            created_user_id: created_user_id,
            updated_user_id: updated_user_id,
            created_at: created_at,
            updated_at: updated_at,
        }
        const queyr_str = `UPDATE books SET 
        name='${name}',
        price='${price}', 
        author_id='${author_id}', 
        genre_id='${genre_id}', 
        image='${image}',
        sample_pdf='${sample_pdf}', 
        published_date='${published_date}',
        description='${description}', 
        updated_user_id='${updated_user_id}',
        updated_at='${updated_at}' 
        WHERE id = '${id}'`;
        const result = connection.query(queyr_str);

        if (result) {
            console.log("UPDATE SUCCESSFULY");
        } else {
            console.log("UPDATING FAIL");
        }
        return this.toModel(itemParams);
    }

    /**
     *delete book
     * @return {BookModel}
     */
    static async delete(bookId) {
        const deleteBook = await this.getById(bookId);
        const spv = deleteBook.image;
        const firstSplitVar = spv.split("/");
        const secondSplitVar = firstSplitVar[7].split(".");
        var deleteImage = await cloudinary.uploader.destroy(secondSplitVar[0], function(result) { console.log(result) });

        const pdfspv = deleteBook.sample_pdf;
        const firstSplitVar1 = pdfspv.split("/");
        const secondSplitVar2 = firstSplitVar1[7].split(".");
        var deletePdf = await cloudinary.uploader.destroy(secondSplitVar2[0], function(result) { console.log(result) });
        
        const result = await connection.query(`DELETE from books WHERE id='${bookId}'`);

        return new BookModel(result);
    }

    /**
     *  Create instances 
     * @param {Object} item
     * @return {BookModel|null}
     */
    static toModel(item) {
        if (!item) return null;
        const params = {
            id: item.id !== undefined ? item.id : null,
            name: item.name !== undefined ? item.name : null,
            price: item.price !== undefined ? item.price : null,
            author_id: item.author_id !== undefined ? item.author_id : null,
            genre_id: item.genre_id !== undefined ? item.genre_id : null,
            image: item.image !== undefined ? item.image : null,
            sample_pdf: item.sample_pdf !== undefined ? item.sample_pdf : null,
            published_date: item.published_date !== undefined ? item.published_date : null,
            history: item.history !== undefined ? item.history : null,
            description: item.description !== undefined ? item.description : null,
            created_user_id: item.created_user_id !== undefined ? item.created_user_id : null,
            updated_user_id: item.updated_user_id !== undefined ? item.updated_user_id : null,
            deleted_user_id: item.deleted_user_id !== undefined ? item.deleted_user_id : null,
            created_at: item.created_at !== undefined ? item.created_at : null,
            updated_at: item.updated_at !== undefined ? item.updated_at : null,
            deleted_at: item.deleted_at !== undefined ? item.deleted_at : null
        };

        return new BookModel(params);
    }
}

module.exports = BookModel;