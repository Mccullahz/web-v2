
import React from 'react';
import './CoffeeItem.css';

function CoffeeItem({ item }) {
  return (
    <div className="coffee-item">
      <img src={item.image} alt={item.name} />
      <h2>{item.name}</h2>
      <p className="item-description">{item.description}</p>
      <p className="item-price">${item.price}</p>
    </div>
  );
}

export default CoffeeItem;