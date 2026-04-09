# Gym Management System

## Project Description
This project is a Gym Management System designed to effectively manage gym operations including member registrations, class schedules, and billing processes. 

## Folder Structure
```
/gym-tcc
|-- /src              # Source code
|-- /docs             # Documentation
|-- /tests            # Test files
|-- README.md         # Project overview
```

## Installation Instructions
1. Clone this repository:
   ```bash
   git clone https://github.com/sraafael/gym-tcc.git
   cd gym-tcc
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```

## How to Run the Application
To run the application, execute:
```bash
npm start
```

## Implemented Features
- Member registration and management
- Class scheduling and booking
- Payment processing and invoicing  

## Future Improvements
- Implement a mobile application interface  
- Add a reporting feature to analyze gym usage  
- Integrate with a third-party payment system

## Password Recovery by CPF

### Implemented flow
- Endpoint `POST /api/auth/forgot-password`:
  - Receives CPF (+ optional role), generates a 6-digit code and sets expiration.
  - Sends the code by e-mail and WhatsApp.
- Endpoint `POST /api/auth/reset-password`:
  - Receives CPF, code and new password.
  - Validates code and updates the user password.

### Required environment variables (real sending)
```env
# Flask
SQLALCHEMY_DATABASE_URI=sqlite:///gym.db
SECRET_KEY=change-me
CORS_ALLOW_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
RESET_CODE_EXPIRATION_MINUTES=10

# SMTP (email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-ou-app-password
SMTP_FROM=seu-email@gmail.com
SMTP_USE_TLS=true

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Dev fallback (prints code in backend console if providers are not configured)
DEV_FAKE_NOTIFICATIONS=true
```
