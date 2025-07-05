# Sahayak - Your AI-Powered Teaching Assistant

<p align="center">
  <img src="https://placehold.co/800x200.png?text=Sahayak" alt="Sahayak Banner" data-ai-hint="banner logo"/>
</p>

**Sahayak** is an AI-powered teaching assistant designed for the vibrant, multi-grade classrooms of India. It empowers teachers with intelligent tools to create personalized learning experiences, streamline administrative tasks, and foster a more engaging educational environment.

This application is built with Next.js, Firebase, and Google's Gemini models via Genkit.

---

## ✨ Key Features

- **Dual-Role Portals**: Separate, tailored dashboards for Teachers and Students.
- **AI Content Creation**: Generate hyper-local stories, visual aids, worksheets, and interactive games in multiple languages.
- **Reading Assessment & Analysis**: AI-powered analysis of students' reading fluency, providing metrics like Words Per Minute (WPM) and accuracy.
- **Differentiated Learning**: Create materials from textbook images and adapt them for various grade levels.
- **Class & Student Management**: Organize students by grade and assign content to individuals or entire classes.
- **Multi-language Support**: The application UI and generated content support multiple Indian languages.

---

## 👩‍🏫 Teacher Portal

The teacher portal is a comprehensive toolkit designed to reduce preparation time and provide deeper insights into student performance.

### 🎨 Create Content
The creative hub of the application.
- **Hyper-Local Content Generator**: Write a prompt for a story or an explanation and generate text tailored to your students' local context and language.
- **Differentiated Materials Creator**: Upload an image of a textbook page. The app uses OCR to extract the text, which you can then use to generate worksheets (Multiple Choice, Fill-in-the-Blanks, Short Answer) for different grade levels.
- **Visual Aid Designer**: Describe a diagram, chart, or illustration, and the AI will generate a visual aid in various styles (hand-drawn, professional, etc.).
- **Game Generator**: Create an interactive quiz or a matching game on any educational topic for any grade level.

### 📚 My Content
A personal library for all your created materials.
- View all saved stories, worksheets, visual aids, and games.
- Filter content by type.
- Assign any content to individual students or an entire grade with a few clicks.
- Edit or delete saved content.

### 📊 Assessments
Streamline the reading assessment process.
- **Assign Passages**: Generate a reading passage with AI or write your own, then assign it to students.
- **Review Submissions**: View a list of student submissions that are pending review.
- **AI-Powered Report**: For each submission, view a detailed report including:
    - Reading fluency (WPM) and accuracy percentage.
    - An interactive transcript that highlights mispronunciations, substitutions, omissions, and insertions.
    - The student's original audio recording, synced with the text.
- **Provide Feedback**: Write and send personalized feedback to the student.

### 🧑‍🎓 My Students
Manage your classroom roster.
- View all registered students, automatically grouped by their grade.
- Simplifies the process of assigning work to specific classes.

### ⚙️ Settings
- Update your profile information (name, school).
- Change your preferred language for the app interface.
- Find your unique **Teacher Code**, which students need to join your class.

---

## 🎓 Student Portal

The student portal is a simple, engaging interface for students to learn and practice.

### 🏠 Home
A personalized dashboard that welcomes the student and provides quick access to:
- Upcoming assignments and assigned lessons.
- A "learning progress" overview (demonstration).

### 📖 My Lessons
- View a list of all practice materials and lessons assigned by the teacher.
- Click to view a story, complete a worksheet, see a visual aid, or play a game.

### 🎤 Reading Assessments
- View reading passages assigned by the teacher.
- Record audio of themselves reading the passage aloud.
- Submit the recording for AI analysis and teacher review.

### ❓ Ask a Question
- An instant knowledge base where students can ask any question and receive a simple, easy-to-understand explanation with analogies.

### 👤 Profile
- Update personal information.
- Change the display language for the app interface.

---

## 🛠️ Technical Stack

- **Framework**: Next.js (App Router)
- **UI**: React, Tailwind CSS, ShadCN UI
- **Generative AI**: Google AI (Gemini) via Genkit
- **Backend & Database**: Firebase (Authentication, Firestore)
- **Deployment**: Docker

---

## 🚀 Getting Started

To run this project locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd sahayak-app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    -   Copy the `.env.example` file to a new file named `.env`.
    -   Fill in the required Firebase and Google AI credentials. You can get these from your [Firebase Project Settings](https://console.firebase.google.com/) and [Google AI Studio](https://aistudio.google.com/app/apikey).

    ```
    # .env
    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_KEY_HERE"
    # ... all other variables
    GOOGLE_API_KEY="YOUR_API_KEY_HERE"
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
