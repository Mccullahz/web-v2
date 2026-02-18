import React from "react";
import { ProjectPage } from "../components/ProjectPage";

export const Lms: React.FC = () => (
  <ProjectPage
    title="Library Managemnet System"
    gifSrc="/images/lmsfp.jpg"
    gifAlt="Library Management System Demo Not Found"
    lead="A GUI application that provides a user-friendly interface for managing library operations such as: addition, deletion, and searching of books, as well as managing user accounts. <br> Built using Java + FX + MySQL."
    overview="This application demonstrates how a simple, user friendly library management system can be implemented using Java and MySQL. Using this application, there are options to:"
    features={[
    "Add new books to the library",
    "Delete books from the library",
    "Search for books in the library",
    "Edit library reports",
    "Generate reports for library items",
    ]}

    description={`<br/>
    Details on how to run the simulator are included in the README. There are no official releases currently available, so this will require cloning the repository.
	    `}
    repoLink="https://www.github.com/Mccullahz/CS3700-LMS"
  />
);
