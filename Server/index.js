const app = require('express')();
const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://dottorciccio03:DetectiveCiccio03@esame-pwm.usssncc.mongodb.net/";

const client = new MongoClient(uri); 

let port = 3000;

async function loginUser(res, body) {
    //let {email, password } = body; 

    //console.log((body.email === undefined ? 'Email mancante' : body.email));

    try {
        await client.connect();
        //let user = await client.db('Users').collection('user').findOne({email: body.email, password: body.password});
        //console.log(user);
    } finally {
        await client.close();
    }
}

app.get('/', (req, res) => {
    res.send('Hello World!');
})

app.post('/login', (req, res) => {
    console.log(req.params.name);
    loginUser(res, req.body)
        .catch((err) => console.log(err));
})

app.listen(port, () => {
    console.log(`Listening to port:${port}`);
})