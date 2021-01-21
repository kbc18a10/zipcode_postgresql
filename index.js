'use strict';

require('dotenv').config();
 
//モジュールの読み込み
const ejs = require('ejs')
const fs = require('fs')
const express = require('express');

const { Pool } = require('pg');

var poolParam = {
  connectionString: process.env.DATABASE_URL
  };

if(!process.env.LOCAL_EXEC){
  poolParam.ssl = {
    rejectUnauthorized: false
  }
};

const pool = new Pool(poolParam);

const app = express(); 
app.use(express.json());

app.engine('ejs',ejs.renderFile);

app.get('/', async(req, res) => {
    var zipcode = req.query.zipcode;
    var zipInfo = {
        "result" : "NotFound"
    };
    try {
      const client = await pool.connect();
      const result = await client.query(`SELECT * FROM zipcode WHERE zipcode='${zipcode}'`);
      const results = { 'results': (result) ? result.rows : null};
    
      results.results.some(function(value) {
        if(value.zipcode == zipcode){
          zipInfo.result = "Found";
          zipInfo.zipcode = value.zipcode;
          zipInfo.prefecture = value.prefecture;
          zipInfo.town = value.town;
          zipInfo.address = value.address;
          return true;
        }
      });

      res.json(zipInfo);

      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }

  });


app.get('/db', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM zipcode');
      const results = { 'results': (result) ? result.rows : null};
      res.render('db.ejs', results );
      client.release();
      if(zipInfo.result == "NotFound"){
        res.status(404).json(zipInfo);
      } else {
          res.json(zipInfo);
      }
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })


app.get('/zipsearcher.html', (req, res) => {
    fs.readFile('./zipsearcher.html', 'utf-8', (err, data) => {
        if (err) {
          res.writeHead(404, {'Content-Type': 'text/plain'});
          res.write('not found');
        } else {
          res.writeHead(200, {'Content-Type': 'text/html'});
          res.write(data);
        }
        res.end();
      });
});
 
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));