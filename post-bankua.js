const mysql = require("mysql2");
const slugify = require('slugify');
const { crc16 } = require('crc');
const envconf = require('dotenv').config();
const cron = require('node-cron');
let nunjucks = require('nunjucks');
const fs = require('fs').promises;
const path = require('path');
const format = require('date-fns/format');

const WEBSITE_ROOT_PATH = process.env.WEBSITE_ROOT_PATH;
const PERSON_PATH = process.env.PERSON_PATH;
const person = process.env.PERSON.split('|');

const Categories = [
    {langDB: 'uk-UA', category: 103, datefnLocale: 'uk'},
    {langDB: 'ru-RU', category: 88, datefnLocale: 'ru'},
    {langDB: 'en-GB', category: 95, datefnLocale: 'en-GB'}

]

if (envconf.error) {   throw envconf.error};        // ERROR if Config .env file is missing

const sortRandom = (arr) => arr.sort(() => Math.random() - 0.5);

const connectionFinance = mysql.createConnection({
    host: process.env.DB_FINHOST,
    port: process.env.DB_FINPORT,
    user: process.env.DB_FINUSER,
    database: process.env.DB_FINDATABASE,
    password:  process.env.DB_FINPASSWORD
}).promise();

const connectionPRESS = mysql.createConnection({
    host: process.env.DB_PRESSHOST,
    port: process.env.DB_PRESSPORT,
    user: process.env.DB_PRESSUSER,
    database: process.env.DB_PRESSDATABASE,
    password:  process.env.DB_PRESSPASSWORD
}).promise();

nunjucks.configure( process.env.PATH_TEMPLATES, {    autoescape: true} ) ;

let now = new Date();       // Now
let aliasUniq =  '-' + crc16(now.toString()).toString(16);

const main = async () => {
try {

    for (let ic = 0, icat; icat=Categories[ic] ;++ic) {
        const lang_DB = icat.langDB;
        const category = icat.category;
        const lang = lang_DB.split('-')[0];
        const Locale = require('date-fns/locale/' + icat.datefnLocale);

        let pesonRand = sortRandom(person)[0];
        const PersonImgPath = path.resolve(PERSON_PATH, pesonRand);
        let PostImgSrc = await getRandomImage(PersonImgPath);
        PostImgSrc = PostImgSrc.replace(WEBSITE_ROOT_PATH,"");


        let dbDate = format(now, "yyyy-LL-dd");
        let sql = "SELECT * FROM bankua WHERE exchangedate='" + dbDate + "'";
        let result = await connectionFinance.query(sql);

        if (result[0].length == 0) return "NO FX DATA";
        const features = result[0];
        const featuresExt = await Promise.all(features.map(async currencyObj => {
            let currCodeArr = currencyObj.code.split('/');
            const code = currCodeArr[0];
            const sql = `SELECT * FROM currency WHERE code='${code}' AND lang='${lang}' LIMIT 1`;
            await connectionFinance.query(sql).then(result => {
                let currName = (result[0][0] != null) ? result[0][0].currency : '';
                currencyObj = {...currencyObj, currency: currName};
                //console.log(code + ' ' + currName);
                //console.log(currencyObj);
            });
            return currencyObj;
        }));


        let dateLoc = format(now, "do MMMM yyyy", {locale: Locale});
        let dateLoc2 = format(now, "d MMMM yyyy", {locale: Locale});
        let PostTitle = nunjucks.render('post-title.' + lang + '.njk', {dateLoc: dateLoc});
        let alias = aliasSlug(PostTitle) + aliasUniq;

        let PostText = nunjucks.render('post-text.' + lang + '.njk', {
            features: featuresExt,
            imgsrc: PostImgSrc, dateloc: dateLoc, dateloc2: dateLoc2
        });
        //console.log(PostTitle);
        //console.log(PostText);

        sql = "INSERT INTO os0fr_content (title, alias, introtext, catid, language, state, created, publish_up, created_by,access) VALUES (?,?,?,?,?,1,NOW(),NOW(),84,1)";
        const post = [PostTitle, alias, PostText, category, lang_DB];
        let res = await connectionPRESS.query(sql, post);
    }   // End For
    return "Successful";
} catch(err) {
        console.log(err);
        }

}

if (process.env.CRON) {
    cron.schedule(process.env.CRON, () =>  {main().then().catch(err => console.error(err));}, { scheduled: true});
} else {
    main()
    .then(created =>
        console.log(created)
    )
    .catch(err => console.error(err));
};
/**
 * getFiles returns a list of all files in a directory path {dirPath}
 * that match a given file extension {fileExt} (optional).
 */
async function  getFiles (dirPath, fileExt = '') {
    // List all the entries in the directory.
    const dirents = await fs.readdir(dirPath, { withFileTypes: true });

    return (
        dirents
        // Omit any sub-directories.
        .filter(dirent => dirent.isFile())
        // Ensure the file extension matches a given extension (optional).
        .filter(dirent =>
            fileExt.length ? dirent.name.toLowerCase().endsWith(fileExt) : true
        )
        // Return a list of file names.
        .map(dirent => dirent.name)
    );
};
async function getRandomImage (dirPath){
    // Get a list of all Markdown files in the directory.
    const fileNames = await getFiles(dirPath, '.jpg');

    // Create a list of files to read.
    const filesToRead = fileNames.map(fileName =>
        path.resolve(dirPath, fileName)
        //dirPath+fileName
    );
    let randFnum = getRandomIntInclusive(0,filesToRead.length-1);
    return filesToRead[randFnum];
};
String.prototype.capitalize = function() { return this.charAt(0).toUpperCase() + this.slice(1);}
function getRandomIntInclusive(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; /*Максимум и минимум включаются */ }
function aliasSlug(text) {
    return slugify(text, {
        remove: /[*+~.()'"!:@]/g,   //  to remove *+~.()'"!:@ from the result slug
        lower: true,                // convert to lower case, defaults to `false`
        strict: true                // strip special characters except replacement, defaults to `false`
    });
}

