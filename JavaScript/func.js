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

let reg_form = document.getElementById('reg-form');
let pref_form = document.getElementById('user-pref');
let artist_id = [];

reg_form.addEventListener('submit', (e) => {
  e.preventDefault();

  const options = {
    method: "POST",
    mode: "cors",
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify(
      {
        email: document.forms['regForm']['email'].value, 
        password: document.forms['regForm']['password'].value,
        username: document.forms['regForm']['username'].value,
        date_of_birth: document.forms['regForm']['dateStandard'].value,
        market: document.forms['regForm']['market'].value

      }
    )
  }

  fetch('http://localhost:3000/addUser', options)
      .then((res) => res.json())
      .then((res) => {
        console.log(res);
        if (res.code == 400) {
          if ((res.type)=="email")
            document.getElementById('emailHelpBlock').classList.remove('d-none');
          else if ((res.type)=="username")
            document.getElementById('usernameHelpBlock').classList.remove('d-none');
          else if(res.type=="password")
            document.getElementById('passwordHelpBlock').innerHTML = res.error;
        } else if (res.code == 201) {
          localStorage.setItem('id_user', res.id);
          reg_form.classList.add('d-none');
          pref_form.classList.remove('d-none');
        }
      })
      .catch((err) => console.log(err));
});

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

let artistBtn = document.getElementById('button-addon2');
artistBtn.addEventListener('click', (e) => {
  e.preventDefault();
  let name = document.getElementById('artist-name').value;
  searchArtist(name);
});

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

document.getElementById('avanti').addEventListener('click', (e) => {
  e.preventDefault();
  var ul = document.getElementsByTagName('ul');
  var li = ul[0].getElementsByTagName('li');
  var genres_pref = [];
  for (var i = 0; i < li.length - 1; i++) {
    genres_pref.push(li[i].innerText);
  }

  const options = {
    method: "POST",
    mode: "cors",
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify(
      {
        id: localStorage.getItem('id_user'),
        liked_artist: artist_id
      }
    )
  }

  fetch('http://localhost:3000/addLikedArtist', options)
    .then((res) => res.json())
    .then((json) => window.location = 'home.html');
  
  //console.log(genres_pref);

});

function changeScreenMedia(media) {
  if (media.matches) {
      document.getElementById('mobileHead').classList.remove('d-none');
  } else {
      document.getElementById('mobileHead').classList.add('d-none');
  }
}
