let auth = {};

async function getApiToken() {
    let url = 'https://accounts.spotify.com/api/token';
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "grant_type=client_credentials&client_id=9cefd444f68140fc86b2a6188e798cab&client_secret=a6d03a39d0d547139184b31464d1d38e"
    }
    let res = (await fetch(url, options)).json();

    return res;
}

if (localStorage.getItem('api_key') == null) {
    getApiToken()
    .then((res) => {
        localStorage.setItem('api_key', res.token_type+' '+res.access_token);
    })
    
} else {
    console.log('[Info]: Api_key gia presente');
}

/*fetch(`https://api.spotify.com/v1/artists/06HL4z0CvFAxyc27GXpf02`, {
    method: "GET",
    headers: {
        Authorization: localStorage.getItem('api_key')
    }
}).then((res) => res.json())
  .then((json) => console.log(json));*/


