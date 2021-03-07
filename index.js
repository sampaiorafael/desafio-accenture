const hapi = require('@hapi/hapi');
const fetch = require('node-fetch');
const mysql = require('mysql');

const server = hapi.server({
    host: 'localhost',
    port: 8080
});

server.route({
    method: 'GET',
    path: '/all',
    handler: async (req, res) => await queryGetValues()
});

server.route({
    method: 'GET',
    path: '/{id}',
    handler: async (req, res) => await queryGetValuesById(req.params.id)
});

const mysqlCon = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'desafio'
});

const queryCreateTable = mysqlCon.query(`
    CREATE TABLE IF NOT EXISTS persons (
        id int(11) NOT NULL,
        name varchar(255),
        height varchar(255),
        hair_color varchar(255),
        skin_color varchar(255),
        eye_color varchar(255),
        birth_year varchar(255),
        gender varchar(255),
        homeworld varchar(255)
    );
`);

const queryInsert = (values) => {
    mysqlCon.query(`
    INSERT INTO persons
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, values)
};

const queryGetValues = async () => {
    return new Promise ((resolve, reject) => {
    mysqlCon.query(`SELECT * FROM persons`, (err, results, field) => {resolve(results)});
    });
};

const queryGetValuesById = async (id) => {
    return new Promise ((resolve, reject) => {
    mysqlCon.query(`
    SELECT * 
    FROM persons
    WHERE id = ?    
    `, id, (err, results, field) => {resolve(results)});
    });
};

const fetchData = async (id) => {
    let getting = await fetch(`https://swapi.dev/api/people/${id}`)
    .then(response => response.json())

    return [
        id,
        getting.name, 
        getting.height, 
        getting.hair_color, 
        getting.skin_color, 
        getting.eye_color, 
        getting.birth_year, 
        getting.gender, 
        getting.homeworld
    ];
};

const init = async (dataFetchTimes) => {

    mysqlCon.connect;

    queryCreateTable;
    
    for (let index = 1; index <= dataFetchTimes; index++) {
        queryInsert(await fetchData(index));
    }
  
    await server.start();
}

init(5);