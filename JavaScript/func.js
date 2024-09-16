let auth = {};
let utentiInvitati = [];

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
const likedGenres = [];
function addGenre(genre) {
    let clone = list.cloneNode(true);

    if (!likedGenres.includes(genre)) {
      clone.getElementsByClassName('form-check-label')[0].innerHTML = genre;
      clone.classList.remove('d-none');
      list.before(clone);
      likedGenres.push(genre);
    }
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




function search(q){
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
    .then((track) => {
      console.log(track);
      const song = document.getElementById('song');
      let clone = song.cloneNode(true);
      clone.id = 'artistSong';

      clone.getElementsByClassName('songImg')[0].src = track.tracks.items[0].album.images[2].url;
      clone.getElementsByClassName('songName')[0].textContent = track.tracks.items[0].name;
      clone.getElementsByClassName('id-song')[0].textContent = track.tracks.items[0].id;
      for(let i = 0; i < track.tracks.items[0].artists.length; i++) {
        if (clone.getElementsByClassName('artistsNames')[0].textContent == '') {
          clone.getElementsByClassName('artistsNames')[0].textContent = clone.getElementsByClassName('artistsNames')[0].textContent  + track.tracks.items[0].artists[i].name; 
        } else {
          clone.getElementsByClassName('artistsNames')[0].textContent = clone.getElementsByClassName('artistsNames')[0].textContent + ', ' + track.tracks.items[0].artists[i].name ; 
        }
      }

      clone.getElementsByClassName('bi')[0].addEventListener('click', (event) => {
        event.preventDefault();
        clone.getElementsByClassName('bi')[0].parentElement.parentElement.parentElement.remove();
      });

      clone.classList.remove('d-none');

      song.before(clone);
    });
}

function showPublicPlaylist() {
  fetch(`http://localhost:3000/getPublicPlaylist`, {method: "GET"})
  .then((res) => res.json())
  .then((playlist) => {
      const playPost = document.getElementById('playPost');
      console.log(playlist);
      for (let i = 0; i < playlist.length; i++) {
          let clone = playPost.cloneNode(true);

          //if (i == playlist.length-1)   clone.childNodes[1].childNodes[1].classList.remove('border-bottom-color');
          clone.getElementsByClassName('post-username')[0].textContent = playlist[i].username;
          clone.getElementsByClassName('card-title')[0].textContent = playlist[i].name;
          clone.getElementsByClassName('card-text')[0].textContent = playlist[i].description;
          clone.getElementsByClassName('btn-light')[0].setAttribute('data-bs-playlistId', playlist[i]._id);

          clone.classList.remove('d-none');

          playPost.before(clone);
      }
      document.getElementById('placeHolder').classList.add('d-none');
  }).catch((err) => console.log(err));
}

async function getUsernameFromId() {
  const result = await fetch(`http://localhost:3000/getUser/${localStorage.getItem('id_user')}`, {method: "GET"});
  const username = (await result.json()).username;
  return username;
}



async function salva() {
  let name = document.getElementById('namePlaylist').value;
  let songName = document.querySelectorAll(".id-song");
  let description = document.getElementById('floatingTextarea').value;
  let playlist = [];

  (document.getElementById('privata').checked) ? privata = true : privata = false;
  
  songName.forEach((element) => playlist.push(element.textContent));
  playlist.pop();

  const options = {
      method: "POST",
      mode: "cors",
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify(
        {
          username: await getUsernameFromId(), 
          isPublic: privata,
          name: name,
          description: description,
          songs: playlist
      
        }
      )
  };


  fetch('http://localhost:3000/addPlaylist', options)
    .then((res) => {
      if (!res.ok) {
        alert('errore');
      } else {
        window.location = 'profilo.html';
      }
    }).catch((err) => console.log(err));
}


function cercaCommunity(){
  const q = document.getElementById('searchCommunity').value;
  document.getElementById('ggg').classList.remove('d-none');
  document.getElementById('cont').classList.add('d-none');
  console.log(q);
  getCommunity(q);
}

async function showCommunity() {
  const username = await getUsernameFromId();
  fetch(`http://localhost:3000/getCommunity/${username}`, {method: 'GET'})
      .then((res) => res.json())
      .then((comm) => {
          let item = document.getElementById('list-home-list');
          console.log(item);
          for (let i = 0; i < comm.length; i++) {
              let clone = item.cloneNode(true);

              clone.textContent = comm[i].name;
              clone.addEventListener('click', (e) => {
                e.preventDefault();
                showCommunityInfo(comm[i]._id);
                clone.classList.add('disabled'); // TODO: Da fare meglio
              })

              clone.classList.remove('d-none');

              item.before(clone);
          }
      });
}

function showCommunityInfo(id_comm) {
  fetch(`http://localhost:3000/getCommunityInfo/${id_comm}`)
    .then((res) => res.json())
    .then((comm) => {
      console.log(comm);
      document.getElementById('nav-tabContent').classList.remove('d-none');
      let playlist = document.getElementById('listPlaylist');
      console.log(playlist);
      
      for (let i = 0; i < comm.shared_playlist.length; i++) {
        let clone = playlist.cloneNode(true);
        clone.getElementsByClassName('img-fluid')[0].src = 'img/playlist_img.png';
        clone.getElementsByClassName('card-title')[0].textContent = comm.shared_playlist[i];
        clone.classList.remove('d-none');
        playlist.before(clone);
      }


    });
}

async function showCommunityS() {
  const username = await getUsernameFromId();
  fetch(`http://localhost:3000/getCommunity/${username}`, {method: 'GET'})
      .then((res) => res.json())
      .then((comm) => {
          let item = document.getElementById('list-community-share');
          console.log(item);
          for (let i = 0; i < comm.length; i++) {
              let clone = item.cloneNode(true);

              clone.textContent = comm[i].name;

              item.before(clone);
          }


      });
}

function aggiungiUtenti(username) {
  if (utentiInvitati.indexOf(username) > -1) {
      utentiInvitati.splice(utentiInvitati.indexOf(username), 1);
  } else {
      utentiInvitati.push(username);
      console.log(utentiInvitati);
  }
}


async function salvaCommunity(){
  let name = document.getElementById('nameCommunity').value;
  let description = document.getElementById('DescriptionCommunity').value;
  let user_id = localStorage.getItem('id_user');

  const options = {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },

   body: JSON.stringify(
    {
      admin: await getUsernameFromId(user_id),
      name: name,
      description: description,
      users: utentiInvitati
    }
   )

  };

  fetch('http://localhost:3000/addCommunity', options)
    .then((res)=>{
      if (!res.ok) {
      alert('errore');
    } else {
      window.location = 'community.html';
    }
  }).catch((err) => console.log(err));


}


async function joinCommunity(user_id, id, community) {
  
  fetch(`http://localhost:3000/joinCom`, {
      method: "POST",
      mode: "cors",
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify(
          {
            name: community,
            users: {user_id}
            

          }
      ) 
  })
}


function searchUser(q){
  fetch(`http://localhost:3000/getUserFromUsername/${q}`, {method: "GET"})
    .then((res) => res.json())
    .then((user) => {
      console.log(user);
      let userList = document.getElementById('userList');
      let warning = document.getElementById('warningUser');
      if (user.username !== undefined) {
        userList.textContent = user.username;
        warning.textContent = ' ';
      } else {
        warning.textContent = user.error.message;
        userList.textContent = ' ';
      }
    }
  )
}


async function getCommunity(q){

  fetch(`http://localhost:3000/getCommunity/${q}`, {method: "GET"})
  .then((res)=>res.json())
  .then((community)=>{
    console.log(community);
    //let risultati = document.getElementById('risultati');
    //await connectToDatabase();
    document.getElementById('nomecommunity').textContent = community.name;
    document.getElementById('descrizionecommunity').textContent = community.description;
    let user_id = localStorage.getItem('id_user');
    document.getElementById('uniscitiCom').addEventListener("click", joinCommunity(user_id,community.name));
 
  })
}



async function getUserPlaylist(id_user) {
  fetch('http://localhost:3000/getPlaylist/'+await getUsernameFromId(), {method: "GET"})
    .then((res) => res.json())
    .then((playlist) => {  
      const myPlaylist = document.getElementById('myplay');
      console.log(playlist);

      for (let i = 0; i < playlist.personal.length; i++) {
          let clone = myPlaylist.cloneNode(true);

          clone.getElementsByClassName('text-white')[0].textContent = playlist.personal[i].name;
          clone.children[0].setAttribute('data-bs-playlistId', playlist.personal[i]._id);

          clone.classList.remove('d-none');

          myPlaylist.before(clone);
      }

      const myFavPlaylist = document.getElementById('myfavplay');
      const nolpText = document.getElementById('nolpText');

      if (playlist.liked.length != 0) {
        nolpText.classList.add('d-none');
        for (let i = 0; i < playlist.liked.length; i++) {
          let clone = myFavPlaylist.cloneNode(true);

          clone.getElementsByClassName('text-white')[0].textContent = playlist.liked[i].name;

          clone.classList.remove('d-none');

          myFavPlaylist.before(clone);
        }
      } else {
        nolpText.classList.remove('d-none');
      }


        
  }).catch((err) => console.log(err));
}

async function showPlaylistInfo(viewPlaylist, playlistId) {
  const options =  {
    method: "GET",
    headers: {
        Authorization: localStorage.getItem('api_key')
    }
  }
  const title = viewPlaylist.querySelector('.modal-title');
  const user = viewPlaylist.querySelector('.playlist-username');
  const descr = viewPlaylist.querySelector('.playlist-descr');
  let songsId = "";

  let res = await fetch(`http://localhost:3000/getUser/${localStorage.getItem('id_user')}`, {method: "GET"});
  let json = await res.json();

  fetch(`http://localhost:3000/getPlaylistInfo/${playlistId}`, {method: "GET"})
    .then((res) => res.json())
    .then((playlist) => {
      const ris = json.playlist.liked.find((element) => element == playlist._id);
      if (ris !== undefined) {
        document.querySelector('.bi-heart').classList.add('d-none');
        document.querySelector('.bi-heart-fill').classList.remove('d-none');
      } else {
        document.querySelector('.bi-heart').classList.remove('d-none');
        document.querySelector('.bi-heart-fill').classList.add('d-none');
      }
      title.textContent = playlist.name;
      user.textContent = playlist.username;
      descr.textContent = playlist.description;
      playlist.songs.forEach((song) => songsId = songsId+song+",");
      //console.log(songsId);
      
      fetch('https://api.spotify.com/v1/tracks?ids='+songsId,options)
      .then((res) => {
          if (!res.ok) {
              if (res.status == 401) {
                  getApiToken()
                      .then((res) => {
                          localStorage.setItem('api_key', res.token_type+' '+res.access_token);
                      })
                      showPlaylistInfo(viewPlaylist, playlistId);
              } else if (res.status == 429) {
                console.log(res);
              }
          } else {
              return res.json();
          }
      })
      .then((json) => {
          console.log(json);
          document.querySelectorAll('[id=song]').forEach((element) => element.remove());
          const song = document.getElementById('showSong');
          for (let i = 0; i < json.tracks.length; i++) {
            let clone = song.cloneNode(true);
            clone.id = 'song';

            clone.getElementsByClassName('song-img')[0].src = json.tracks[i].album.images[0].url;
            clone.getElementsByClassName('song-name')[0].textContent = json.tracks[i].name;
            clone.getElementsByClassName('s-duration')[0].textContent = millisToMinutesAndSeconds(json.tracks[i].duration_ms);

            json.tracks[i].artists.forEach((artist) => {
              if (clone.getElementsByClassName('artist-name')[0].textContent == '') {
                clone.getElementsByClassName('artist-name')[0].textContent = clone.getElementsByClassName('artist-name')[0].textContent  + artist.name; 
              } else {
                clone.getElementsByClassName('artist-name')[0].textContent = clone.getElementsByClassName('artist-name')[0].textContent + ', ' + artist.name; 
              }
            })
            

            clone.classList.remove('d-none');

            song.before(clone);
          }
      }).catch((err) => console.log(err));
    }).catch((err) => console.log(err));
}

function millisToMinutesAndSeconds(millis) {
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

const viewPlaylist = document.getElementById('viewPlaylist');
console.log(viewPlaylist);
if (viewPlaylist) {
    viewPlaylist.addEventListener('show.bs.modal', (event) => {
        const btn = event.relatedTarget;
        const playlistId = btn.getAttribute('data-bs-playlistId');
        showPlaylistInfo(viewPlaylist, playlistId);
        //res = showPlaylistInfo(viewPlaylist, playlistId);
        //console.log(res);
        //res =>res.json();
        /*for(let i=0;i<2;i++){
        document.getElementById('song-name').textContent = res.name[i];
        //
        }*/
    });
}