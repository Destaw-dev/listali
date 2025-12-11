import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailVerification(to: string, token: string, username: string, language: string) {
  try {
    const isHebrew = language === 'he';
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}${isHebrew ? '/he' : '/en'}/auth/verify-email?token=${token}&email=${encodeURIComponent(to)}`;
    
    const emailContent = isHebrew ? {
      subject: 'אימות כתובת אימייל - Smart List 📧',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Smart List</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">אימות כתובת אימייל</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
            <h2 style="color: #333; margin-top: 0;">שלום ${username} 👋</h2>
            
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              תודה שנרשמת ל-Smart List! כדי להשלים את ההרשמה ולגשת לכל התכונות של האפליקציה, 
              אנא אמת את כתובת האימייל שלך.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        font-weight: bold; 
                        font-size: 16px;
                        display: inline-block;">
                אמת את האימייל שלי ✅
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.5;">
              אם הכפתור לא עובד, תוכל להעתיק ולהדביק את הקישור הבא בדפדפן שלך:
            </p>
            
            <div style="background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <code style="color: #495057; font-size: 12px; word-break: break-all;">${verificationUrl}</code>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.5;">
              <strong>חשוב:</strong> קישור זה תקף ל-24 שעות בלבד. אם לא אימתת את האימייל שלך בזמן, 
              תוכל לבקש קישור חדש מהאפליקציה.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>אם לא ביקשת אימות זה, אנא התעלם מהמייל.</p>
            <p>Smart List - מערכת חכמה לניהול רשימת קניות קבוצתיות 🛒</p>
          </div>
        </div>
      `
    } : {
      subject: 'Email Verification - Smart List 📧',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Smart List</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Email Verification</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${username} 👋</h2>
            
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              Thank you for registering with Smart List! To complete your registration and access all app features, 
              please verify your email address.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        font-weight: bold; 
                        font-size: 16px;
                        display: inline-block;">
                Verify My Email ✅
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.5;">
              If the button doesn't work, you can copy and paste the following link into your browser:
            </p>
            
            <div style="background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <code style="color: #495057; font-size: 12px; word-break: break-all;">${verificationUrl}</code>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.5;">
              <strong>Important:</strong> This link is valid for 24 hours only. If you don't verify your email in time, 
              you can request a new link from the app.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>If you didn't request this verification, please ignore this email.</p>
            <p>Smart List - Smart system for managing group shopping lists 🛒</p>
          </div>
        </div>
      `
    };
    
    const res = await resend.emails.send({
      from: 'Smart List <onboarding@resend.dev>',
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    return res;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}

export async function sendGroupInviteEmail(to: string, code: string) {
  try {
    const res = await resend.emails.send({
      from: 'My App <onboarding@resend.dev>',
      to,
      subject: 'קוד הצטרפות לקבוצה 🛒',
      html: `<p>שלום 👋</p><p>קוד ההצטרפות שלך הוא: <strong>${code}</strong></p>`,
    });

    return res;
  } catch (error) {
    console.error('שגיאה בשליחת מייל:', error);
    throw error;
  }
}
