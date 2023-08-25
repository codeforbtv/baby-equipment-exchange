import React, { useEffect, useState } from 'react';
import {collection, getDocs } from 'firebase/firestore';
import { db } from '../api/init-firebase';

export default function ListUsers() {
  const [Users, setUsers] = useState([]);

  useEffect(() => {
    getUsers()
  }, [])

  useEffect(() => {
    console.log(Users)
  }, [Users];

  function getUsers() {
    const UsersCollectionRef = collection(db, 'Users');
    getDocs(UsersCollectionRef)
      .then(response => {
        const Users = response.docs.map(doc => ({
          data: doc.data(),
          id: doc.id,
        }))
        setUsers(Users);
      });
      .catch(error => console.log(error.message));
  }

  return (
    <div>
      <h4>ListUsers</h4>
      <button onclick={() => getUsers()}>Refresh Users</button>
      <ul>
        {Users.map(User => (
          <li key={User.id}>{Users.data.name}</li>
        ))};
      </ul>
    </div>
  )
}
