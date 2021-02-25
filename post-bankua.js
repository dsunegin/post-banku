const mysql = require("mysql2");
const envconf = require('dotenv').config();
const { crc16 } = require('crc');
let nunjucks = require('nunjucks');
const format = require('date-fns/format');
let ruLocale = require('date-fns/locale/ru');
let enLocale = require('date-fns/locale/en-GB');
let ukLocale = require('date-fns/locale/uk');


if (envconf.error) {   throw envconf.error};        // ERROR if Config .env file is missing

const connectionFinance = mysql.createConnection({
    host: process.env.DB_FINHOST,
    port: process.env.DB_FINPORT,
    user: process.env.DB_FINUSER,
    database: process.env.DB_FINDATABASE,
    password:  process.env.DB_FINPASSWORD
}).promise();

nunjucks.configure( process.env.PATH_TEMPLATES, {
    autoescape: true
} ) ;

let now = new Date();       // Now
let aliasUniq =  '-' + crc16(now.toString()).toString(16);

let lang = 'ru';


let dataTextNj = {
    page_title: "Cool Product",
    features: [
        {
            name: "Speed",
            description: "It's fast."
        },
        {
            name: "Reliability",
            description: "You can count on it."
        },
        {
            name: "Security",
            description: "You don't have to worry about it."
        }
    ]
};

    let dbDate = format(now, "yyyy-LL-dd", {locale: ukLocale});
    const sql = " SELECT * FROM bankua WHERE exchangedate='" + dbDate + "'";
    connectionFinance.query(sql)
    .then(result => {
        if (result[0].length > 0) process.exit();

        let PostText = nunjucks.render('post-text.' + lang + '.njk', dataTextNj);
        let PostTitle = nunjucks.render('post-title.' + lang + '.njk', dataTitleNj);

        //console.log(PostTitle);
        //console.log(PostText);

        const sql = "";
        const fxitem = [fxcode, dbDate, item.rate];
        let res = connectionFinance.query(sql, fxitem);
        //console.log(result[0]);
    })
    .catch(err => {
        console.log(err);
    })





function getRandomIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min; //Максимум и минимум включаются
}
String.prototype.capitalize = function() { return this.charAt(0).toUpperCase() + this.slice(1);}