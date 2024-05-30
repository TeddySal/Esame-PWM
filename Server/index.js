const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const fs = require('fs');

const uri = "mongodb+srv://dottorciccio03:DetectiveCiccio03@esame-pwm.usssncc.mongodb.net/";

const app = express();
const client = new MongoClient(uri); 

app.use(cors());
app.use(express.json());

let port = 3000;

async function loginUser(res, body) {
    if (body.email === undefined) {
        res.status(400).send('[ERRORE]: Email mancante');
        return;
    } else if (body.password === undefined) {
        res.status(400).send('[ERRORE]: Password mancante');
        return;
    }

    try {
        await client.connect();
        let user = await client.db('Users').collection('user').findOne({email: body.email, password: body.password});
        console.log(user);
        if (user == null) {
            res.status(404).send({code:404, error: "[ERRORE]: Utente non trovato"});
        } else {
            res.json(user._id);
        }
    } finally {
        await client.close();
    }
}


async function addUser(res, newUser) {
    if (newUser.email === "") {
        res.status(400).send({"error": "email mancante"});
        return;
    }
    if (newUser.password === "") {
        res.status(400).send({"error": "password mancante"});
        return;
    }
    if (newUser.date_of_birth === "") {
        res.status(400).send({"error": "Data di nascita mancante"});
        return;
    }
    if (newUser.market === "") {
        res.status(400).send({"error": "market mancante"});
        return;
    }
    if(newUser.password.length<8){
        res.status(400).send({"code":400,"type":"password","error": "Password troppo corta"});
        return;
    }
    if ((newUser.password.match(/[a-z]/g)==null) || (newUser.password.match(/[A-Z]/g)==null)) {
        res.status(400).send({"code":400,"type":"password","error": "La password deve contenere caratteri maiuscoli e minuscoli"});
        return;
    }
   //console.log(newUser.password.match(/[A-Z]/g));
    if ((newUser.password.match(/[^a-zA-Z\d]/g)==null)){
        res.status(400).send({"code":400,"type":"password","error": "La password deve contenere almeno un carattere speciale"});
        return;
    }

    try {
        await client.connect();
        let user = await client.db('Users').collection('user').findOne({email: newUser.email}); 
        if (user == null) {
            let user = await client.db('Users').collection('user').findOne({username: newUser.username});
            if (user == null) {
                await client.db('Users').collection('user').insertOne(
                    {
                        email: newUser.email,
                        password: newUser.password,
                        username: newUser.username,
                        date_of_birth: newUser.date_of_birth,
                        liked_artist:[],
                        liked_genres:[],
                        playlist:{
                            personal:[],
                            liked:[]
                        },
                        market: newUser.market
                    }
                );
                res.status(201).send({code: 201, text: 'Utente aggiunto'});
            } else {
                res.status(400).send({code: 400,type:"username", errore: "Utente gia presente, cambiare username"});
            }
        } else {
            res.status(400).send({code: 400,type:"email", errore: "Utente gia presente, cambiare email"});
        }

        
    } finally {
        await client.close();
    }
}

app.get('/', (req, res) => {
    res.send('Hello World!');
})

app.post('/login', (req, res) => {
    loginUser(res, req.body)
        .catch((err) => console.log(err));
})

app.post('/addUser', (req, res) => {
    addUser(res, req.body)
       .catch((err) => console.log(err));
})

app.get('/getGenres', (req, res)=>{
    res.send(fs.readFileSync('generi.json'))
})

app.listen(port, () => {
    console.log(`Listening to port:${port}`);
})

