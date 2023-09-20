// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'

import { getFirestore } from 'firebase/firestore'

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: 'AIzaSyDfv1GI3fwfAin17N_Pf2G9fe8PPBa1UPs',
    authDomain: 'baby-equipment-exchange.firebaseapp.com',
    projectId: 'baby-equipment-exchange',
    storageBucket: 'baby-equipment-exchange.appspot.com',
    messagingSenderId: '375825360663',
    appId: '1:375825360663:web:2307ccd57b31bf1d74b952'
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firestore
export const db = getFirestore(app)
