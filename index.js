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

        const moviesInfo = await queryGetMoviesValues(req.params.id);
        const vehiclesInfo = await queryGetVehiclesValues(req.params.id);
        const speciesInfo = await queryGetSpeciesValues(req.params.id);
        const starshipsInfo = await queryGetStarshipsValues(req.params.id);

        result = moviesInfo[0];
        result.movies = [];
        result.vehicles = [];
        result.species = [];
        result.starships = [];

        moviesInfo.forEach(element => {
            result.movies.push(element.title);
        });

        vehiclesInfo.forEach(element => {
            result.vehicles.push(element.name);
        });

        speciesInfo.forEach(element => {
            result.species.push(element.name);
        });

        starshipsInfo.forEach(element => {
            result.starships.push(element.name);
        });

        delete result.title;
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
        homeworld varchar(255),
        created varchar(255),
        edited varchar(255),
        url varchar(255)
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

const queryCreateStarshipsTable = mysqlCon.query(`
    CREATE TABLE IF NOT EXISTS starships (
        id int(11) NOT NULL AUTO_INCREMENT,
        name varchar(255),
        person_id varchar(50),
        PRIMARY KEY (id)
    );
`);

const queryCreateSpeciesTable = mysqlCon.query(`
    CREATE TABLE IF NOT EXISTS species (
        id int(11) NOT NULL AUTO_INCREMENT,
        name varchar(255),
        person_id varchar(50),
        PRIMARY KEY (id)
    );
`);

const queryCreateVehiclesTable = mysqlCon.query(`
    CREATE TABLE IF NOT EXISTS vehicles (
        id int(11) NOT NULL AUTO_INCREMENT,
        name varchar(255),
        person_id varchar(50),
        PRIMARY KEY (id)
    );
`);

const queryInsertPersons = (values) => {
    mysqlCon.query(`INSERT INTO persons VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`, values);
};

const queryInsertMovies = (values) => {
    mysqlCon.query(`INSERT INTO movies (title, person_id) VALUES (?, ?)`, values);
};

const queryInsertVehicles = (values) => {
    mysqlCon.query(`INSERT INTO vehicles (name, person_id) VALUES (?, ?)`, values);
};

const queryInsertSpecies = (values) => {
    mysqlCon.query(`INSERT INTO species (name, person_id) VALUES (?, ?)`, values);
};

const queryInsertStarships = (values) => {
    mysqlCon.query(`INSERT INTO starships (name, person_id) VALUES (?, ?)`, values);
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

const queryGetMoviesValues = async (id) => {
    return new Promise ((resolve, reject) => {
        mysqlCon.query(`
        SELECT pe.*, mo.title
        FROM persons pe
        LEFT JOIN movies mo
        ON pe.id = mo.person_id
        WHERE pe.id = ?
        `, id, (err, results, field) => {resolve(results)});
        });
}

const queryGetVehiclesValues = async (id) => {
    return new Promise ((resolve, reject) => {
        mysqlCon.query(`
        SELECT pe.*, ve.name
        FROM persons pe
        RIGHT JOIN vehicles ve
        ON pe.id = ve.person_id
        WHERE pe.id = ?
        `, id, (err, results, field) => {resolve(results)});
        });
}
const queryGetSpeciesValues = async (id) => {
    return new Promise ((resolve, reject) => {
        mysqlCon.query(`
        SELECT pe.*, sp.name
        FROM persons pe
        RIGHT JOIN species sp
        ON pe.id = sp.person_id
        WHERE pe.id = ?
        `, id, (err, results, field) => {resolve(results)});
        });
}
const queryGetStarshipsValues = async (id) => {
    return new Promise ((resolve, reject) => {
        mysqlCon.query(`
        SELECT pe.*, st.name
        FROM persons pe
        RIGHT JOIN starships st
        ON pe.id = st.person_id
        WHERE pe.id = ?
        `, id, (err, results, field) => {resolve(results)});
        });
}

const fetchPersonData = async (id) => {

    let data = {};
    data.moviesInfo = [];
    data.speciesInfo = [];
    data.vehiclesInfo = [];
    data.starshipsInfo = [];
    data.id = id;

    let person = await fetch(`https://swapi.dev/api/people/${id}`)
    .then(response => response.json());

    let moviesArray = person.films;
    let speciesArray = person.species;
    let vehiclesArray = person.vehicles;
    let starshipsArray = person.starships;

    let homeworldInfo = await fetch(person.homeworld)
        .then(response => response.json());
        person.homeworld = homeworldInfo.name;
 
    for (let i = 0; i < moviesArray.length; i++) {
        let movieInfo = await fetch(moviesArray[i])
        .then(response => response.json());
        data.moviesInfo.push(movieInfo.title);
    };

    for (let i = 0; i < speciesArray.length; i++) {
        let speciesInfo = await fetch(speciesArray[i])
        .then(response => response.json());
        data.speciesInfo.push(speciesInfo.name);
    };

    for (let i = 0; i < vehiclesArray.length; i++) {
        let vehiclesInfo = await fetch(vehiclesArray[i])
        .then(response => response.json());
        data.vehiclesInfo.push(vehiclesInfo.name);
    };

    for (let i = 0; i < starshipsArray.length; i++) {
        let starshipsInfo = await fetch(starshipsArray[i])
        .then(response => response.json());
        data.starshipsInfo.push(starshipsInfo.name);
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
        person.homeworld,
        person.created,
        person.edited,
        person.url 
    ];

    return data ;
};

const init = async (initialId, finalId) => {

    mysqlCon.connect;

    queryCreatePersonTable;
    queryCreateMoviesTable;
    queryCreateStarshipsTable;
    queryCreateSpeciesTable;
    queryCreateVehiclesTable;

    let index = initialId
    
    for (index; index <= finalId; index++) {
        let fetchResult = await fetchPersonData(index)

        queryInsertPersons(fetchResult.person);
        
        for (let i = 0; i < fetchResult.moviesInfo.length; i++) {
            queryInsertMovies([fetchResult.moviesInfo[i], fetchResult.id]);
        };
        for (let i = 0; i < fetchResult.vehiclesInfo.length; i++) {
            queryInsertVehicles([fetchResult.vehiclesInfo[i], fetchResult.id]);
        };
        for (let i = 0; i < fetchResult.speciesInfo.length; i++) {
            queryInsertSpecies([fetchResult.speciesInfo[i], fetchResult.id]);
        };
        for (let i = 0; i < fetchResult.starshipsInfo.length; i++) {
            queryInsertStarships([fetchResult.starshipsInfo[i], fetchResult.id]);
        };

    };

};

const go = async () =>{
    console.log('Servidor Iniciado')
    await server.start();
}

go()
