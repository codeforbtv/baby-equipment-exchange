import React, { useState } from 'react'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '../api/init-firebase'

export default function AddUser() {
  const [name, setName] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (name === '') {
      return
    }
    const UsersCollectionRef = collection(db, 'Users')
    addDoc(UsersCollectionRef, { name }).then(response => {
      console.log(response)
    }).catch(error => {
      console.log(error.message)
    })
    alert(name)
  }
  return (
    <div>
      <h4>AddUser</h4>
      <form onSubmit={handleSubmit}>
        <input 
          type="text"
          value={name}
          onChange={ e => setName(e.target.value)} />
        <button type="submit">Add User</button>
      </form>
    </div>
  )
}
