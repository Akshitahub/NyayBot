# NyayBot

NyayBot is a web-based application designed to simplify legal reporting workflows for individuals and organizations. It provides structured, guided flows for generating reports and navigating legal processes in a clear and user-friendly manner.

---

## Project Overview

The application provides two primary reporting paths:
- Individual users
- Organizations

Each flow guides users step-by-step and generates structured outputs based on the data entered.

---

## Features

- Individual reporting workflow with guided steps  
- Organization reporting workflow with structured flow  
- Dynamic report generation based on user input  
- Component-based architecture using React  
- Multi-language support using a translation system  
- Clean navigation with reusable components  
- Separate modules for report creation and report display  
- Scalable structure for future backend integration  

---

## Tech Stack

- Frontend: React.js  
- Styling: CSS  
- Version Control: Git  
- Repository Hosting: GitHub  

---

## Project Structure

nyaybot-v2/
 ├── public/
 │   ├── index.html
 │   └── .env
 ├── src/
 │   ├── components/
 │   │   ├── Home.js
 │   │   ├── IndFlow.js
 │   │   ├── IndReport.js
 │   │   ├── OrgFlow.js
 │   │   ├── OrgReport.js
 │   │   └── Nav.js
 │   ├── App.js
 │   ├── App.css
 │   ├── index.js
 │   └── translations.js
 ├── package.json
 └── package-lock.json

---

## How It Works

1. User lands on the home page  
2. Selects Individual or Organization flow  
3. Follows guided input steps  
4. System processes the input  
5. Generates a structured report  

---

## Installation and Setup

Clone the repository:
git clone https://github.com/Akshitahub/NyayBot.git
cd nyaybot-v2

Install dependencies:
npm install

Run the application:
npm start

Application runs on:
http://localhost:3000

---

## Environment Configuration

Create a `.env` file if needed:
REACT_APP_API_URL=your_api_url

---

## Future Scope

- Backend integration  
- Authentication system  
- Database integration  
- API-based report processing  
- Deployment with CI/CD  
- Performance optimization  
- Mobile responsiveness improvements  

---

## Author

Akshita Singh  
https://github.com/Akshitahub  

---

## License

This project is open-source and available under the MIT License.
