[Project Name: Syntax Slayer]

# Project Story & Concept
The "Syntax Slayer" is an educational 2D RPG designed to gamify the review process for IT students. Unlock your inner programmer and fight actual bugs as the player takes on the role of a Full-Stack Developer. To restore the peace, the player must navigate the corrupted environment and defeat bugs by answering technical trivia questions correctly.

This project addresses the 2D Game Development theme by providing an immersive, interactive alternative to traditional flashcards.

# Development Stack (Full-Stack Architecture)
This application utilizes a modern full-stack architecture deployed on Vercel:

* Frontend Framework: React.js (Vite)
* Game Engine: Phaser 3 (integrated as a React Component)
* Backend/Database: Supabase (PostgreSQL) for storing:
    * User Profiles & Authentication
    * Question Bank (dynamically fetched)
    * Global Leaderboards
* Deployment: Vercel (CI/CD connected to GitHub)

# Team Roles
* Lead Frontend and UI: Romeo Gucela
* Lead Game Developer: Ronald S. Aguillas
* Lead Backend and Content: Sophia Guhiting

# Setup Instructions
1.  Clone the repository:
    git clone [https://github.com/](https://github.com/)[your-username]/[repo-name].git
    cd [repo-name]

2.  Install dependencies:
    npm install
    
3.  Create a `.env` file and add the Supabase keys:
    
VITE_SUPABASE_URL=https://grnnopjwbgomegbnqpsx.supabase.co
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdybm5vcGp3YmdvbWVnYm5xcHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NzM3OTQsImV4cCI6MjA4MDI0OTc5NH0.KjYedlh1HGZY8KBOfRK0LsqsZEiBNewf48gr1fctYe0

   
4.  Run the local development server:
    npm run dev
  

# How to Play
1.  Login: Create an account to track your progress.
2.  Explore: Use `WASD` or `Arrow Keys` to move around the campus.
3.  Battle: Walk into a "Bug Monster" to enter battle and trigger a coding question. It will be timed. If the timer runs out then the bug will attack. 
4.  Win: Answer correctly to debug the monster and earn XP.
