# Email Verification Setup

## Environment Variables Required

To enable email verification, you need to set the following environment variables:

### Required Variables

```bash
# Email service (Resend)
RESEND_API_KEY=your-resend-api-key-here

# Frontend URL for verification links
FRONTEND_URL=http://localhost:3000
```

### Optional Variables

```bash
# Server port (default: 3001)
PORT=3001

# Node environment (default: development)
NODE_ENV=development
```

## Getting a Resend API Key

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add it to your environment variables

## How It Works

1. **Registration**: When a user registers, a verification token is generated and stored
2. **Email Sending**: A verification email is sent using Resend with a beautiful HTML template
3. **Language Detection**: The system automatically detects Hebrew vs English based on username characters
4. **Verification**: User clicks the link in the email to verify their account
5. **Resend**: Users can request a new verification email if needed

## Email Templates

The system includes:
- **Hebrew Template**: RTL layout with Hebrew text
- **English Template**: LTR layout with English text
- **Responsive Design**: Works on all devices
- **Branded Styling**: Smart List branding with gradients

## Testing

To test email verification:
1. Set up your environment variables
2. Register a new user
3. Check your email for the verification link
4. Click the link to verify your account

## Troubleshooting

- **Emails not sending**: Check your RESEND_API_KEY
- **Wrong frontend URL**: Verify FRONTEND_URL environment variable
- **Email delivery issues**: Check Resend dashboard for delivery status 