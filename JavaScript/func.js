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

function checkForAccount() {
  if (localStorage.getItem('id_user') === null) {
      document.getElementById('nav-btn').classList.remove('d-none');
      document.getElementById('nav-list').classList.add('d-none');
  } else {
      document.getElementById('nav-btn').classList.add('d-none');
      document.getElementById('nav-list').classList.remove('d-none');
  }
}


let artist_id = [];



async function loadGenres() {
     /* const options =  {
      method: "GET",
      headers: {
          Authorization: localStorage.getItem('api_key')
      }
  }
      fetch('https://api.spotify.com/v1/recommendations/available-genre-seeds',options)
          .then((res) => {
              if (!res.ok) {
                  if (res.status == 401) {
                      getApiToken()
                          .then((res) => {
                              localStorage.setItem('api_key', res.token_type+' '+res.access_token);
                          })
                      loadGenres();
                  } else if (res.status == 429) {
                    console.log(res);
                  }
              } else {
                  return res.json();
              }
          })
          .then((json) => {
              console.log(json);
              let select = document.getElementById('sel-gen');
              for (let i = 0; i < json.genres.length; i++) {
                  let option = document.createElement('option');
                  option.value = json.genres[i];
                  option.innerHTML = json.genres[i];
                  select.appendChild(option);
              }
          })
          .catch((err) => console.log(err));

      //console.log(res);*/

          fetch('http://localhost:3000/getGenres',{method:"GET"})
          .then((res)=>res.json())
          .then((json)=>{
              let select = document.getElementById('sel-gen');
              for (let i = 0; i < json.genres.length; i++) {
                  let option = document.createElement('option');
                  option.value = json.genres[i];
                  option.innerHTML = json.genres[i];
                  select.appendChild(option);
              }

          }) 
          .catch((err)=>console.log(err));


}

const list = document.getElementById('selected-genres');
function addGenre(genre) {
    let clone = list.cloneNode(true);

    clone.getElementsByClassName('form-check-label')[0].innerHTML = genre;
    clone.classList.remove('d-none');
    list.before(clone);
}



function searchArtist(name) {
  fetch(`https://api.spotify.com/v1/search?q=artist:${name}&type=artist&market=IT&limit=10`, {method: "GET",
  headers: {Authorization: localStorage.getItem('api_key')}})
    .then((res) => {
      if (!res.ok) {
        getApiToken().then((res) => {localStorage.setItem('api_key', res.token_type+' '+res.access_token);})
        searchArtist(name);
      } else {
        return res.json();
      }
    }).then((artists) => {
      //console.log(artists);
      document.querySelectorAll('[id=card-list]').forEach((element) => element.remove());
      let card = document.getElementById('card-list-none');
      for (let i = 0; i < artists.artists.items.length; i++) {
        let clone = card.cloneNode(true);
        clone.id = 'card-list';
        clone.getElementsByClassName('card-img-top')[0].src = artists.artists.items[i].images[1].url;
        clone.getElementsByClassName('card-title')[0].innerHTML = artists.artists.items[i].name;
        clone.getElementsByClassName('id-art')[0].innerHTML = artists.artists.items[i].id;
        clone.getElementsByClassName('p-art')[0].addEventListener('click',(e) => {
          e.preventDefault()
          if (clone.getElementsByClassName('card-img-top')[0].classList[1] == 'round-green') {
            clone.getElementsByClassName('card-img-top')[0].classList.remove('round-green');
            clone.id = 'card-list';
            const index = artist_id.indexOf(clone.getElementsByClassName('id-art')[0].innerHTML);
            if (index > -1) {
              artist_id.splice(index, 1);
            }
          } else {
            clone.getElementsByClassName('card-img-top')[0].classList.add('round-green');
            clone.id = 'card-list-pref';
            artist_id.push( clone.getElementsByClassName('id-art')[0].innerHTML);
          }
          console.log(artist_id);
        });
        clone.classList.remove('d-none');
        card.before(clone);
      }
      
    }).catch((err) => console.log(err));
}



function changeScreenMedia(media) {
  if (media.matches) {
      document.getElementById('mobileHead').classList.remove('d-none');
  } else {
      document.getElementById('mobileHead').classList.add('d-none');
  }
}


document.getElementById('cercaBtn').addEventListener('click',()=>{  
  console.log("ciao");
  let q = document.getElementById('cerca').value;
  search(q);})
   

function search(q){
  console.log("ciao");
  fetch(`https://api.spotify.com/v1/search?q=${q}&type=track&market=IT&limit=1`, {method: "GET",
    headers: {Authorization: localStorage.getItem('api_key')}})
    .then((res) => {
      if (!res.ok) {
        getApiToken().then((res) => {localStorage.setItem('api_key', res.token_type+' '+res.access_token);})
        search(q);
      } else {
        return res.json();
      }
    })
    .then((track)=>{
      console.log(track);
    }
      )
}

