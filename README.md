[Project Name: Syntax Slayer]

# Project Story & Concept
The "Syntax Slayer" is an educational 2D RPG designed to gamify the review process for IT students. Unlock your inner programmer and fight actual bugs as the player takes on the role of a Full-Stack Developer. To restore the peace, the player must navigate the corrupted environment and defeat bugs by answering technical trivia questions correctly.

This project addresses the 2D Game Development theme by providing an immersive, interactive alternative to traditional flashcards. As well as 3D implementation via the loading screen.

# Development Stack (Full-Stack Architecture)
This application utilizes a modern full-stack architecture deployed on Vercel:

* Frontend Framework: React.js (Vite)
* 3D Rendering: React Three Fiber (Three.js for 3D elements)
* Game Engine: Phaser 3 (integrated as a React Component)
* Backend/Database: Supabase (PostgreSQL) for storing:
    * User Profiles & Authentication
    * Question Bank (dynamically fetched)
    * Global Leaderboards
* Deployment: Vercel (CI/CD connected to GitHub)

# Team Roles
* Lead Frontend and UI: Romeo Gucela
* Lead Game Developer and Project Leader: Ronald S. Aguillas
* Lead Backend and Content: Sophia Guhiting

# Prerequisites
* Node.js 
* npm 
* Git

# Setup Instructions
1.  Clone the repository:
    ```bash
    git clone [https://github.com/](https://github.com/)[your-username]/[repo-name].git
    cd [repo-name]
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```
    
4.  Create a `.env` file and add the Supabase keys:
```bash
VITE_SUPABASE_URL="Ask the owner for the url"
VITE_SUPABASE_ANON_KEY="Ask the owner for the keys"
```

   
4.  Run the local development server:
    ```bash
    npm run dev
    ```
  

# How to Play
1.  Explore: Use `WASD` to move around the campus.
2.  Battle: Walk into a "Bug Monster" to enter battle and trigger a coding question. It will be timed. If the timer runs out then the bug will attack. 
3.  The bug monster's question difficulty varies from the type (i.e., Rat = Easy, Slime = Medium, Golem = Hard).
4.  Win: Answer correctly to debug the monster and earn XP.
