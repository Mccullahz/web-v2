import React from 'react';
import './Navbar.css';
import { FaShoppingCart } from 'react-icons/fa';
import { Link } from 'react-router-dom';


function Navbar() {
  return (
    <div className="navbar">
      <a href="/">Home</a>
      <a href="/shop">Shop</a>
      <a href="/contact">Contact</a>

      <Link to="/cart">
      <FaShoppingCart />
      </Link>      
    </div>
  );
}

export default Navbar;