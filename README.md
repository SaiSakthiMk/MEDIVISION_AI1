# Here are your Instructions
📂 Repository Structure
/client: React frontend with high-contrast UI components.

/server: Express backend handling image uploads via Multer and bridging to Python.

/ai_engine: Python scripts containing the agentic logic and model integration.

/docs: Project documentation and sample datasets.

⚙️ Installation & Local Setup
1. Prerequisites
Node.js (v16+)

Python 3.9+

MongoDB Instance

2. Environment Configuration
Create a .env file in the root directory:

PORT=5000
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_google_ai_key

3. Execution
Run Backend:

Bash
cd server
npm install
npm run dev
Run Frontend:

Bash
cd client
npm install
npm start
Install AI Dependencies:

Bash
pip install agno pillow google-generativeai
