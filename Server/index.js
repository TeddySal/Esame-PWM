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
        res.status(400).send({error: {status: 400, message: 'Email mancante'}});
        return;
    } else if (body.password === undefined) {
        res.status(400).send({error: {status: 400, message: 'Password mancante'}});
        return;
    }

    try {
        await client.connect();
        let user = await client.db('Users').collection('user').findOne({email: body.email, password: body.password});
        //console.log(user);
        if (user == null) {
            res.status(404).send({error: {status: 400, message: "Utente non trovato"}});
        } else {
            res.json(user._id);
        }
    } finally {
        await client.close();
    }
}


async function addUser(res, newUser) {
    if (newUser.email === "") {
        res.status(400).send({error: {status: 400, type: 'email', message: 'Email mancante'}});
        return;
    }
    if (newUser.password === "") {
        res.status(400).send({error: {status: 400, type: 'password', message: 'Password mancante'}});
        return;
    }
    if (newUser.date_of_birth === "") {
        res.status(400).send({error: {status: 400, type:'dob', message: 'Data di nascita mancante'}});
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
                        name: newUser.name,
                        surname: newUser.surname,
                        email: newUser.email,
                        password: newUser.password,
                        username: newUser.username,
                        date_of_birth: newUser.date_of_birth,
                        liked_artist:[],
                        liked_genres:[],
                        playlist:{
                            personal:[],
                            liked:[]
                        }
                    }
                );
                user = await client.db('Users').collection('user').findOne({email: newUser.email});
                res.status(201).send({success: {status: 201, id: user._id}});
            } else {
                res.status(400).send({error: {status: 400, message: 'Utente gia presente, cambiare password'}});
            }
        } else {
            res.status(400).send({error: {status: 400, message: 'Utente gia presente, cambiare email'}});
        }

        
    } finally {
        await client.close();
    }
}

async function addLikedArtistAndGenres(res, body) {
    try {
        await client.connect()
        for (let i = 0; i < body.liked_genres.length; i++) {
            await client.db('Users').collection('user').updateOne(
                {_id: new ObjectId(body.id)},
                {$push: {liked_genres: body.liked_genres[i]}}
            );
        }

        for (let i = 0; i < body.liked_artist.length; i++) {
            await client.db('Users').collection('user').updateOne(
                {_id: new ObjectId(body.id)},
                {$push: {liked_artist: body.liked_artist[i]}}
            );
        }
        res.status(201).send({success: {status: 201, message: 'Informazioni aggiornate'}});
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
                tags: body.tags,
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

        res.status(201).send({success: {status: 201, message: 'Playlist creata con successo'}});

        
    } finally {
        await client.close();
    }
}

async function addCommunity(res, body){
    try {
        await client.connect();
        body.users.push(body.admin);
        let result = await client.db('Users').collection('community').insertOne(
            {
                admin: body.admin,
                name: body.name,
                description: body.description,
                users: body.users,
                shared_playlist: []
            }

        );

        res.status(201).send({success: {status: 201, message: 'Community creata con successo'}});

        
    } finally {
        await client.close();
    }
}

async function addPlaylistToCommunity(res, body){
    try {
        await client.connect();
        
        let result = await client.db('Users').collection('community').updateOne(
            { _id: new ObjectId(body.id_comm)},
            { $push: { "shared_playlist": new ObjectId(body.id_playlist) }}
        );

        res.status(201).send({success: {status: 201, message: 'Playlist inserita nella community'}});

        
    } finally {
        await client.close();
    }
}

async function getUser(res, id) {
    try {
        await client.connect();
        let user = await client.db('Users').collection('user').findOne({_id: new ObjectId(id)});
        //console.log(user);
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
            res.status(404).send({error: {status: 404, message: 'Non esistono playlist pubbliche'}});
        } else {
            res.status(200).send(playlist);
        }
    } finally {
        await client.close();
    }
}

async function searchPlaylist(res, name) {
    try {
        await client.connect();
        let playlist = await client.db('Users').collection('playlist').find({name: {$regex: `(?i)${name}(?-i)`}}).toArray();
        let tag = await client.db('Users').collection('playlist').find({tags: {$regex: `(?i)${name}(?-i)`}}).toArray();
        let result = playlist.concat(tag);
        if (result.length == 0) {
            res.status(404).send({error: {status: 404, message: 'La ricerca non ha dato risultati'}});
        } else {
            //Ellimina i doppioni nell'array di oggetti
            jsonObject = result.map(JSON.stringify);
            uniqueSet = new Set(jsonObject);
            uniqueResult = Array.from(uniqueSet).map(JSON.parse);
            //---------------
            res.status(200).send(uniqueResult);
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

async function getUserFromUsername(res, user) {
    try{
        await client.connect();
        let username = await client.db('Users').collection('user').findOne({username: user});
        if(username === null){
            res.status(404).send({error: {status: 404, message: "Username non trovato"}});
        } else {
            res.status(200).send(username);
        }
    } finally {
        await client.close();
    }
  }

async function changeUsername(res, body){
    try{
        await client.connect();
        let cuser = await client.db('Users').collection('user').updateOne({_id: new ObjectId(body.id)},{ $set: { "username": body.newUser } });
        res.status(200);

    } finally{
        await client.close();
    }
}


async function changeEmail(res, body){
    try{
        await client.connect();
        let cuser = await client.db('Users').collection('user').updateOne({_id: new ObjectId(body.id)},{ $set: { "email": body.newEmail } });
        res.status(200);

    } finally{
        await client.close();
    }
}


async function changePassword(res, body){
    try{
        await client.connect();
        let cuser = await client.db('Users').collection('user').updateOne({_id: new ObjectId(body.id)},{ $set: { "password": body.newPassword } });
        res.status(200);

    } finally{
        await client.close();
    }
}


async function getPlaylistInfo(res, id_play) {
    try {
        await client.connect();
        let plalist = await client.db('Users').collection('playlist').findOne({_id: new ObjectId(id_play)});
        console.log(plalist);
        if (plalist === null) {
            res.status(404).send({error: {status: 404, message: "Playlist non trovata"}});
        } else {
            res.status(200).send(plalist);
        }
    } finally {
        await client.close();
    }
}

async function getPlaylists(res, user_id) {
    try {
        await client.connect();
        let user = await client.db('Users').collection('user').findOne({_id: new ObjectId(user_id)});
        let playlists = [];
        for (let i = 0; i < user.playlist.personal.length; i++) {
            playlists.push(await client.db('Users').collection('playlist').findOne({_id: new ObjectId(user.playlist.personal[i])}));
        }

        if (playlists.length == 0) {
            res.status(404).send({error: {status: 404, message: "Playlist non presenti"}});
        } else {
            res.status(200).send(playlists);
        }
    } finally {
        await client.close();
    }
}

async function getCommunity(res, q){

    try{
        await client.connect();
        let rc = await client.db('Users').collection('community').findOne({name: q});
        if(rc === null){
            res.status(404).send({error: {status: 404, message:"Nessuna community trovata"}});
        }else{
            res.status(200).send(rc);
        }
    } finally {
        await client.close();
    }
}

async function deletePlaylist(res, playlist_id) {
    try {
        await client.connect();
        await client.db('Users').collection('playlist').deleteOne({_id: new ObjectId(playlist_id)});
        await client.db('Users').collection('user').findOneAndUpdate({"playlist.personal": new ObjectId(playlist_id)}, {$pull: {"playlist.personal": new ObjectId(playlist_id)}});
        await client.db('Users').collection('community').updateMany({shared_playlist: new ObjectId(playlist_id)}, {$pull: {shared_playlist: new ObjectId(playlist_id)}});
        //res.status(200).send(response);
        res.status(200).send({success: {status: 200, message: 'Playlist ellimanata con successo'}});
    } finally {
        await client.close();
    }
}

async function addSongFromPlaylist(res, body) {
    try {
        await client.connect();

        for (let i = 0; i < body.song_id.length; i++) {
            await client.db('Users').collection('playlist').updateOne(
                { _id: new ObjectId(body._id)},
                { $push: { songs: body.song_id[i] }}
            );
        }
        


        res.status(201).send({success: {status: 201, message: 'Canzone inserita nella playlist'}});

        
    } finally {
        await client.close();
    }
}

async function deleteSongFromPlaylist(res, body) {
    try {
        await client.connect();
        console.log(body);
        await client.db('Users').collection('playlist').updateOne({_id: new ObjectId(body._id)}, {$pull: {songs: body.song_id}});
        res.status(200).send({success: {status: 200, message: 'Canzone ellimanata con successo'}});
    } finally {
        await client.close();
    }
}

async function sharePlaylist(res, body){
    try{
        await client.connect();

        let community = await client.db('Users').collection('community').findOne(
           {
            name: body.name,
           } 

        );
            let result = await client.db('Users').collection('community').updateOne(
                {name: body.name},
                {$push: {"shared_playlist": (body.nomePlaylistt)}}
            );
           // console.log(result);
           // res.status(201).send({success: {status: 201, message: "Playlist condivisa"}});
            
        


    }finally {
        await client.close();
    }
}

async function changePlaylistName(res, body) {
    try {
        await client.connect();
        await client.db('Users').collection('playlist').updateOne({_id: new ObjectId(body._id)}, {$set: {name: body.newName}});
        res.status(200).send({success: {status: "200", message: "Nome Playlist modificata con successo"}});
    } finally {
        await client.close();
    }
}

async function changePlaylistIsPublic(res, body) {
    try {
        await client.connect();
        await client.db('Users').collection('playlist').updateOne({_id: new ObjectId(body._id)}, {$set: {isPublic: body.isPublic}});
        res.status(200).send({success: {status: "200", message: "Playlist modificata con successo"}});
    } finally {
        await client.close();
    }
}

async function changePlaylistDescription(res, body) {
    try {
        await client.connect();
        await client.db('Users').collection('playlist').updateOne({_id: new ObjectId(body._id)}, {$set: {description: body.newDescr}});
        res.status(200).send({success: {status: "200", message: "Playlist modificata con successo"}});
    } finally {
        await client.close();
    }
}

async function addLikedPlaylist(res, body) {
    try {
        await client.connect();
        
        let playlist = await client.db('Users').collection('user').findOne(
            {  
                username: body.username,
                "playlist.liked": new ObjectId(body.id_playlist)

            }
        );
        console.log(playlist);
        if (playlist === null) {
            let result = await client.db('Users').collection('user').updateOne(
                {username: body.username},
                {$push: {"playlist.liked": new ObjectId(body.id_playlist)}}
            );
            console.log(result);
            res.status(201).send({success: {status: 201, message: "Playlist aggiunti ai preferiti"}});
        } else {
            await client.db('Users').collection('user').updateOne(
                {username: body.username},
                {$pull: {"playlist.liked": new ObjectId(body.id_playlist)}}
            );
            res.status(200).send({success: {status: 200, message: "Playlist eliminata dai mi piace"}});
            /*removeLikedPlaylist(res, body)
                .catch((err) => console.log(err));*/
        }
        
    } finally {
        await client.close();
    }
}

async function removeLikedPlaylist(res, body) {
    try {
        await client.connect();
        await client.db('Users').collection('user').updateOne(
            {_id: new ObjectId(body.id_user)},
            {$unset: {"personal.liked": body.id_playlist}}
        );
        res.status(200).send({success: {status: 200, message: "Playlist eliminata dai mi piace"}});
    } finally {
        client.close();
    }
}

async function joinCom(res, body){
 
    /*await client.connect();
    const filter = {name: body.community};
    const update = {$set: {users: body.user_id}};
    
    await client.db('Users').collection('community').updateOne(filter, update);*/
  
}

async function getCommunity(res, user) {
    try {
        await client.connect();

        let comm = await client.db('Users').collection('community').find({users: user}).toArray();
        if (comm.length == 0) {
            res.status(404).send({error: {status: 404, message: 'Non ci sono community a cui fai parte'}});
        } else {
            res.status(200).send(comm);
        }
    } finally {
        await client.close();
    }
}
/*
async function getCommunitySharedPlaylist(res, id_comm) {
    try {
        await client.connect();
        let playlist_ids = (await client.db('Users').collection('community').findOne({_id: new ObjectId(id_comm)})).shared_playlist;
        let playlists = []
        for (let i = 0; i < playlist_ids.length; i++) {
            //console.log(await client.db('Users').collection('playlist').findOne({_id: new ObjectId(playlist_ids[i])}));
            playlists.push(await client.db('Users').collection('playlist').findOne({_id: new ObjectId(playlist_ids[i])}));
        }

        res.status(200).send(playlists);
    } finally {
        await client.close();
    }
}*/

async function getCommunityInfo(res, id) {
    try {
        await client.connect();

        let comm = await client.db('Users').collection('community').findOne({_id: new ObjectId(id)});

        res.status(200).send(comm);
    } finally {
        await client.close();
    }
}

async function getUsers(res) {
    try {
        await client.connect();
        let users = await client.db('Users').collection('user').find().toArray();
        res.status(200).send(users);
    } finally {
        await client.close();
    }
}

async function deleteUser(res, id_user) {
    try {
        await client.connect();
        console.log(id_user);
        await client.db('Users').collection('user').deleteOne({_id: new ObjectId(id_user)});
        res.status(200).send({success: {status: 200, message: 'User elliminato correttamente'}});
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

app.post('/addLikedArtistAndGenres', (req, res) => {
    addLikedArtistAndGenres(res, req.body)
        .catch((err) => console.log(err));
})

app.post('/addPlaylist', (req, res) => {
    addPlaylist(res, req.body)
        .catch((err) => console.log(err));
})

app.post('/addCommunity', (req, res) => {
    addCommunity(res, req.body)
        .catch((err) => console.log(err));
})

app.post('/addPlaylistToCommunity', (req, res) => {
    addPlaylistToCommunity(res, req.body)
        .catch((err) => console.log(err));
})

app.post('/sharePlaylist', (req, res) => {
    sharePlaylist(res, req.body)
        .catch((err) => console.log(err));
})

app.post('/changeUsername', (req,res)=> {
    changeUsername(res, req.body)
    .catch((err) => console.log(err));
})

app.post('/changeEmail', (req,res)=> {
    changeEmail(res, req.body)
    .catch((err) => console.log(err));
})

app.post('/changePassword', (req,res)=> {
    changePassword(res, req.body)
    .catch((err) => console.log(err));
})

app.get('/getPublicPlaylist', (req, res) => {
    getPublicPlaylist(res)
        .catch((err) => console.log(err));
})

app.get('/searchPlaylist/:name', (req, res) => {
    searchPlaylist(res, req.params.name)
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

app.get('/getPlaylists/:user_id', (req, res) => {
    getPlaylists(res, req.params.user_id)
        .catch((err) => console.log(err));
})

app.get('/getCommunity/:q', (req, res) => {
    getCommunity(res, req.params.q)
        .catch((err) => console.log(err));
})

app.get('/getCommunitySharedPlaylist', (req, res) => {
    getCommunitySharedPlaylist(res, req.query.id)
        .catch((err) => console.log(err));
})

app.get('/getUserFromUsername/:q', (req, res) => {
    getUserFromUsername(res, req.params.q)
        .catch((err) => console.log(err));
})

app.delete('/deletePlaylist/:id', (req, res) => {
    deletePlaylist(res, req.params.id)
        .catch((err) => console.log(err));
})

app.delete('/deleteSongFromPlaylist', (req, res) => {
    deleteSongFromPlaylist(res, req.body)
        .catch((err) => console.log(err));
})

app.post('/changePlaylistName', (req, res) => {
    changePlaylistName(res, req.body)
        .catch((err) => console.log(err));
})

app.post('/addSongFromPlaylist', (req, res) => {
    addSongFromPlaylist(res, req.body)
        .catch((err) => console.log(err));
})

app.post('/changePlaylistIsPublic', (req, res) => {
    changePlaylistIsPublic(res, req.body)
        .catch((err) => console.log(err));
})

app.post('/changePlaylistDescription', (req, res) => {
    changePlaylistDescription(res, req.body)
        .catch((err) => console.log(err));
})

app.post('/addLikedPlaylist', (req, res) => {
    addLikedPlaylist(res, req.body)
        .catch((err) => console.log(err));
})

app.post('/joinCom', (req, res) => {
    joinCom(res, req.body)
        .catch((err) => console.log(err));
})

app.get('/getCommunity/:user', (req, res) => {
    getCommunity(res, req.params.user)
        .catch((err) => console.log(err));
})

app.get('/getCommunityInfo/:id', (req, res) => {
    getCommunityInfo(res, req.params.id)
        .catch((err) => console.log(err));
})

app.get('/getUsers', (req, res) => {
    getUsers(res)
        .catch((err) => console.log(err));
})

app.delete('/deleteUser/:id', (req, res) => {
    console.log(req.params.id);
    deleteUser(res, req.params.id)
        .catch((err) => console.log(err));
})

app.listen(port, () => {
    console.log(`Listening to port:${port}`);
})