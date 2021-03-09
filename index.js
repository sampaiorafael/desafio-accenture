const hapi = require('@hapi/hapi');
const fetch = require('node-fetch');
const mysql = require('mysql');

const server = hapi.server({
    host: 'localhost',
    port: 8080
});

server.route({
    method: 'GET',
    path: '/',
    handler: async (req, res) => await queryGetValues()
});

server.route({
    method: 'GET',
    path: '/{id}',
    handler: async (req, res) => await queryGetValuesById(req.params.id)
});

server.route({
    method: 'GET',
    path: '/fullinfo/{id}',
    handler: async (req, res) => {
        let result = {};

        const personInfo = await queryGetAllValues(req.params.id);

        result.person = personInfo[0];
        result.movies = [];

        personInfo.forEach(element => {
            result.movies.push(element.title);
        });

        delete result.person.title;
        return result;
    }
});

server.route({   
    method: 'GET',
    path: '/getPersons',   
    handler: async (request,h) => {
       const queryParam = request.query  
       
        if (queryParam.count){ //parametro count informado
            await init(1,queryParam.count) //?count
        }else 
        if ( (queryParam.initialId) && (queryParam.finalId) ){  //parametro initialId e finalId Informado
            await init(queryParam.initialId, queryParam.finalId)   //?initialId=1&finalId=2
        } //nenhum parametro informado
        return await queryGetValues()    
        
    }
});

const mysqlCon = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'desafio'
});

const queryCreatePersonTable = mysqlCon.query(`
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

const queryCreateMoviesTable = mysqlCon.query(`
    CREATE TABLE IF NOT EXISTS movies (
        id int(11) NOT NULL AUTO_INCREMENT,
        title varchar(255),
        person_id varchar(50),
        PRIMARY KEY (id)
    );
`);

const queryInsertPersons = (values) => {
    mysqlCon.query(`INSERT INTO persons VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`, values);
};

const queryInsertMovies = (values) => {
    mysqlCon.query(`INSERT INTO movies (title, person_id) VALUES (?, ?)`, values);
};

const queryGetValues = async () => {
    return new Promise ((resolve, reject) => {
    mysqlCon.query(`SELECT * FROM persons`, (err, results, field) => {resolve(results)});
    });
};

const queryGetValuesById = async (id) => {
    return new Promise ((resolve, reject) => {
    mysqlCon.query(`SELECT * FROM persons WHERE id = ?`, id, (err, results, field) => {resolve(results)});
    });
};

const queryGetAllValues = async (id) => {
    return new Promise ((resolve, reject) => {
        mysqlCon.query(`
        SELECT p.*, m.title
        FROM persons p
        LEFT JOIN movies m
        ON p.id = m.person_id
        WHERE p.id = ?
        `, id, (err, results, field) => {resolve(results)});
        });
}

const fetchPersonData = async (id) => {

    let data = {};
    data.moviesInfo = [];
    data.id = id;

    let person = await fetch(`https://swapi.dev/api/people/${id}`)
    .then(response => response.json());

    let moviesArray = person.films;
 
    for (let i = 0; i < moviesArray.length; i++) {
        let movieInfo = await fetch(moviesArray[i])
        .then(response => response.json());
        data.moviesInfo.push(movieInfo.title);
    };

    data.person = [
        id,
        person.name, 
        person.height, 
        person.hair_color, 
        person.skin_color, 
        person.eye_color, 
        person.birth_year, 
        person.gender, 
        person.homeworld
    ];

    return data ;
};

const init = async (initialId, finalId) => {

    mysqlCon.connect;

    queryCreatePersonTable;
    queryCreateMoviesTable;

    let index = initialId
    
    for (index; index <= finalId; index++) {
        let fetchResult = await fetchPersonData(index)

        queryInsertPersons(fetchResult.person);
        
        for (let i = 0; i < fetchResult.moviesInfo.length; i++) {
            queryInsertMovies([fetchResult.moviesInfo[i], fetchResult.id]);
        };

    };

};

const go = async () =>{
    console.log('Servidor Iniciado')
    await server.start();
}

go()
