import React from "react";

export const Lms: React.FC = () => (
    <section className="process-sim">
      <div className="sim-container">
        <h2>Library Management System</h2>
        <div className="lms-prev">
	<img
          src="/images/lms-prev.gif"
          alt="Missing Library Management System Demo"
          className="sim-gif"
        />
	</div>

        <p className="sim-lead">
          A GUI application that provides a user-friendly interface for managing library operations such as: addition, deletion, and searching of books, as well as managing user accounts.
			  <br />
	Built using Java + FX + MySQL
        </p>

        <h2>Overview</h2>
        <p>This application demonstrates how a simple, user friendly library management system can be implemented using Java and MySQL. Using this application, there are options to:</p>
	<ul>
	  <li>Add new books to the library</li>
	  <li>Delete books from the library</li>
	  <li>Search for books in the library</li>
	  <li>Edit library reports</li>
  	  <li>Generate reports for library items</li>
        </ul>
	<p>
	<br/>

	  For additional details or to view the source code, check out the <a href="https://www.github.com/Mccullahz/CS3700-LMS">GitHub repository: Here</a>. Details on how to run the simulator are included in the README. There are no official releases currently available, so this will require cloning the repository.
        </p>
      </div>
    </section>
  );

