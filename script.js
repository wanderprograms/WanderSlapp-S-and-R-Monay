import { firebaseConfig, sendToAirtel, sendToTNM } from './api/configAndApis.js';

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
let notifications = [];

document.addEventListener("DOMContentLoaded", () => {
  // UI Switching
  function showRegister() {
    document.getElementBy
