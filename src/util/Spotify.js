const clientId = '475be2057bb24d3cb6619f696e246d1c'
const redirectUri = 'https://vesta-nna.github.io/jammming/'
let accessToken

const Spotify = {
  getAccessToken() {
    console.log('into accessToken')
    if (accessToken) {
      return accessToken
    }

    // check for access token match
    const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/)
    const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/)
    if (accessTokenMatch && expiresInMatch) {
      accessToken = accessTokenMatch[1]
      const expiresIn = Number(expiresInMatch[1])
      // This clears the parameter, allowing us to grab a new access token when it expires.
      window.setTimeout(() => accessToken = '', expiresIn * 1000)
      window.history.pushState('Access Token', null, '/')
      return accessToken
    } else {
      const accessUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectUri}`
      window.location = accessUrl
    }
  },

  search(term) {
    const accessToken = this.getAccessToken()
    return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }).then(response => {
      return response.json()
    }).then(jsonResponse => {
      if (!jsonResponse.tracks) {
        return []
      }
      return jsonResponse.tracks.items.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0].name,
        album: track.album.name,
        uri: track.uri
      }))
    })
  },

  savePlaylist(name, trackUris) {
    if (!name || !trackUris.length) {
      return
    }

    const accessToken = this.getAccessToken()
    const headers = { Authorization: `Bearer ${accessToken}` }
    let userId

    return fetch('https://api.spotify.com/v1/me', { headers: headers }
    ).then(response => {
      return response.json()
    }).then(jsonResponse => {
      userId = jsonResponse.id
      return fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
        headers: headers,
        method: 'POST',
        body: JSON.stringify({ name: name })
      }).then(response => response.json()
      ).then(jsonResponse => {
        const playlistId = jsonResponse.id
        return fetch(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`, {
          headers: headers,
          method: 'POST',
          body: JSON.stringify({ uris: trackUris })
        })
      })
    })
  }
}

export default Spotify
