import { effect } from 'easy-peasy';
import { fetchLyrics$ } from '../services/music-service';
import {
  checkLocalStorage,
  setInLocalStorage
} from '../util/localstorage-util';

// rehydrate the favorite lyrics collection
// state from localStorage if it exist
const initialState = {
  favoriteLyrics: checkLocalStorage('favoriteLyrics', []),
  isLyricsNotFound: false,
  isLyricsLoading: false,
  lyrics: '',
  artist: '',
  song: ''
};

// lift the observable stream into a variable
// so that we can unsubscribe from another functionw within the model
let requestStream;

export const musicModel = {
  music: {
    ...initialState,
    getLyrics: effect(async (dispatch, payload, getState) => {
      const { artist, song } = payload;
      dispatch.music.updateIsLyricsNotFound(false);
      dispatch.music.updateIsLyricsLoading(true);
      dispatch.music.updateCurrentArtist(artist);
      dispatch.music.updateCurrentSong(song);
      requestStream = fetchLyrics$(payload).subscribe({
        next: ({ lyrics }) => dispatch.music.updateCurrentLyrics(lyrics),
        error: data => dispatch.music.updateIsLyricsNotFound(true),
        complete: data => dispatch.music.updateIsLyricsLoading(false)
      });
    }),
    cancelLyricSearch: effect(async (dispatch, payload, getState) => {
      requestStream.unsubscribe();
      dispatch.music.updateIsLyricsLoading(false);
    }),
    addToFavoriteLyrics: (state, payload) => {
      let favoriteLyricsWithAddition = [...state.favoriteLyrics, payload];
      /**
       *  https://github.com/ctrlplusb/easy-peasy#installation
       *  🙌 thanks to immer
       *  ..Mutate the state directly. Under the hood we convert this to an
       *  an immutable update in the store, but at least you don't need to
       *  worry about being careful to return new instances etc. This also
       *  makes it 👇 easy to update deeply nested items.
       */
      state.favoriteLyrics = favoriteLyricsWithAddition;
      // store the customer selection state offline
      setInLocalStorage('favoriteLyrics', favoriteLyricsWithAddition);
    },
    updateIsLyricsLoading: (state, payload) => {
      state.isLyricsLoading = payload;
    },
    updateIsLyricsNotFound: (state, payload) => {
      state.isLyricsNotFound = payload;
    },
    updateCurrentArtist: (state, payload) => {
      state.artist = payload;
    },
    updateCurrentSong: (state, payload) => {
      state.song = payload;
    },
    updateCurrentLyrics: (state, payload) => {
      state.lyrics = payload;
    },
    purgeFavorites: (state, payload) => {
      state.favoriteLyrics = [];

      //clear local storage as well
      localStorage.removeItem('favoriteLyrics');
    }
  }
};
