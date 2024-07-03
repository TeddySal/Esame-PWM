const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
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
                user = await client.db('Users').collection('user').findOne({email: newUser.email});
                res.status(201).send({code: 201, text: 'Utente aggiunto', id: user._id});
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

async function addLikedArtist(res, body) {
    try {
        await client.connect()
        for (let i = 0; i < body.liked_artist.length; i++) {
            await client.db('Users').collection('user').updateOne(
                {_id: new ObjectId(body.id)},
                {$push: {liked_artist: body.liked_artist[i]}}
            );
        }
        res.status(201).send({message: "Fatto"});
    } finally {
        await client.close();
    }
}

async function addPlaylist(res, body){
    try {
        await client.connect();
        console.log(body);
        let result = await client.db('Users').collection('playlist').insertOne(
            {
                username: body.username,
                isPublic: body.isPublic,
                name: body.name,
                description: body.description,
                songs: body.songs
            }

        );
        let id = result.insertedId.toHexString();
        //console.log(id);
        //let user = await client.db('Users').collection('user').findOne({_id: new ObjectId(body.id_user)});
        //console.log(user);
        await client.db('Users').collection('user').updateOne(
            { username: body.username},
            { $push: { "playlist.personal": new ObjectId(id) }}
        );

        //console.log(respn);

        res.status(201).send("playlist creata");

        
    } finally {
        await client.close();
    }
}

async function getUser(res, id) {
    try {
        await client.connect();
        let user = await client.db('Users').collection('user').findOne({_id: new ObjectId(id)});
        console.log(user);
        res.status(201).send(user);
    } finally {
        //await client.close();
    }
}

async function getPublicPlaylist(res) {
    try {
        await client.connect();
        let playlist = await client.db('Users').collection('playlist').find({isPublic: true}).toArray();

        if (playlist === null) {
            res.status(404).send('Non esistono playlist pubbliche');
        } else {
            res.status(200).send(playlist);
        }
    } finally {
        await client.close();
    }
}

async function getPlaylist(res, username) {
    try {
        await client.connect();
        //res.status(200).send({error: "Help"});
        console.log(username);
        let playlistDB = await client.db('Users').collection('user').findOne({username: username});
        console.log(playlistDB);
        let playlist = {
            personal: [],
            liked: []
        };
        
        for (let i = 0; i < playlistDB.playlist.personal.length; i++) {
            playlist.personal.push(await client.db('Users').collection('playlist').findOne({_id: new ObjectId(playlistDB.playlist.personal[i])}));
        }

        for (let i = 0; i < playlistDB.playlist.liked.length; i++) {
            playlist.liked.push(await client.db('Users').collection('playlist').findOne({_id: new ObjectId(playlistDB.playlist.liked[i])}));
        }

        res.status(200).send(playlist);
        
    } finally {
       await client.close();
    }
}

async function getPlaylistInfo(res, id_play) {
    try {
        await client.connect();
        let plalist = await client.db('Users').collection('playlist').findOne({_id: new ObjectId(id_play)});

        if (plalist === null) {
            res.status(404).send({error: {status: 404, message: "Playlist non trovata"}});
        } else {
            res.status(200).send(plalist);
        }
    } finally {
        await client.close();
    }
}

// TODO: Creare una funzione che ellimini le playlist dal db
async function deletePlaylist(res, user_id) {
    try {
        await client.connect();

        const result = null;
    } finally {
        await client.close();
    }
}

app.post('/login', (req, res) => {
    loginUser(res, req.body)
        .catch((err) => console.log(err));
})

app.get('/getUser/:id', (req, res) => {
    getUser(res, req.params.id)
        .catch((err) => console.log(err));
})

app.post('/addUser', (req, res) => {
    addUser(res, req.body)
       .catch((err) => console.log(err));
})

app.get('/getGenres', (req, res)=>{
    res.send(fs.readFileSync('generi.json'))
})

app.post('/addLikedArtist', (req, res) => {
    addLikedArtist(res, req.body)
        .catch((err) => console.log(err));
})

app.post('/addPlaylist', (req, res) => {
    addPlaylist(res, req.body)
        .catch((err) => console.log(err));
})

app.get('/getPublicPlaylist', (req, res) => {
    getPublicPlaylist(res)
        .catch((err) => console.log(err));
})

app.get('/getPlaylistInfo/:id', (req, res) => {
    getPlaylistInfo(res, req.params.id)
        .catch((err) => console.log(err));
})

app.get('/getPlaylist/:username', (req, res) => {
    getPlaylist(res, req.params.username)
        .catch((err) => console.log(err));
})

app.delete('/deletePlaylist/:id', (req, res) => {
    deletePlaylist(res, req.params.id)
        .catch((err) => console.log(err));
})

app.listen(port, () => {
    console.log(`Listening to port:${port}`);
})

