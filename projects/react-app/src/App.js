import React from 'react';
import './App.css';
import Navbar from './Navbar';
import CoffeeItem from './CoffeeItem';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import espressoImage from './img/esp.jpg';
import cappuccinoImage from './img/cap.jpg';

function App() {
  const coffeeItems = [
    {
      id: 1,
      name: 'Espresso',
      description: 'This is a description of id 1',
      price: 2.5,
      image: espressoImage,
    },
    {
      id: 2,
      name: 'Cappuccino',
      description: 'This is a description of id 2',
      price: 3.5,
      image: cappuccinoImage, //images no worky
    },
    // Add more items as needed...
  ];

  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/cart" element={<div>Cart Page</div>} />
          <Route path="/" element={
            <>
              <header className="App-header">
                <h1>Cozy Coffee Co</h1>
              </header>
              <div className="coffee-items">
                {coffeeItems.map(item => (
                  <CoffeeItem key={item.id} item={item} />
                ))}
              </div>
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;