import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = 'Listali <hello@listali.co.il>';


export async function sendEmailVerification(to: string, token: string, username: string, language: string = 'he') {
  const translations = {
    he: {
      subject: 'אימות כתובת אימייל - Listali 📧',
      welcome: (name: string) => `שלום ${name} 👋`,
      body: 'תודה שנרשמת ל-Listali! כדי להשלים את ההרשמה ולנהל רשימות קניות יחד, אנא אמת את כתובת האימייל שלך.',
      button: 'אמת את האימייל שלי ✅',
      footer: 'Listali - עושים קניות יחד 🛒',
      dir: 'rtl' as const,
    },
    en: {
      subject: 'Email Verification - Listali 📧',
      welcome: (name: string) => `Hello ${name} 👋`,
      body: 'Thanks for joining Listali! To complete your registration and start managing shopping lists together, please verify your email address.',
      button: 'Verify My Email ✅',
      footer: 'Listali - Shopping together 🛒',
      dir: 'ltr' as const,
    }
  };
  try {

    const lang = language === 'en' ? translations.en : translations.he;
    
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.listali.co.il';
    const verificationUrl = `${frontendUrl}/${language}/auth/verify-email?token=${token}&email=${encodeURIComponent(to)}`;
    
    return await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: lang.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; direction: ${lang.dir}; text-align: ${lang.dir === 'rtl' ? 'right' : 'left'};">
          <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Listali</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">${lang.subject.split(' - ')[0]}</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
            <h2 style="color: #333; margin-top: 0;">${lang.welcome(username)}</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">${lang.body}</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: #0070f3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                ${lang.button}
              </a>
            </div>
            
            <div style="background: #e9ecef; padding: 10px; border-radius: 5px; word-break: break-all;">
              <code style="font-size: 12px; color: #666;">${verificationUrl}</code>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>${lang.footer}</p>
          </div>
        </div>
      `
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}

export async function sendGroupInviteEmail(
  to: string, 
  code: string, 
  inviterName: string = 'A friend', 
  language: string = 'he',
  isNewUser: boolean = false
) {
  const isHebrew = language === 'he';
  const frontendUrl = process.env.FRONTEND_URL || 'https://www.listali.co.il';
  
  const actionUrl = isNewUser 
    ? `${frontendUrl}/${language}/auth/register?inviteCode=${code}`
    : `${frontendUrl}/${language}/dashboard/groups/join?code=${code}`;

  const content = {
    subject: isHebrew 
      ? (isNewUser ? `הזמנה להצטרף ל-Listali מ-${inviterName}` : `קוד הצטרפות לקבוצה ב-Listali 🛒`)
      : (isNewUser ? `Invitation to join Listali from ${inviterName}` : `Group Join Code - Listali 🛒`),
    
    title: isHebrew ? `בואו נעשה קניות יחד!` : `Let's shop together!`,
    
    description: isHebrew 
      ? (isNewUser 
          ? `<strong>${inviterName}</strong> מזמין אותך להצטרף ל-<strong>Listali</strong>. זו הדרך הכי קלה לנהל רשימות קניות משותפות עם המשפחה והחברים בזמן אמת.` 
          : `<strong>${inviterName}</strong> שלח לך קוד הצטרפות לקבוצת הקניות שלו ב-Listali.`)
      : (isNewUser
          ? `<strong>${inviterName}</strong> invited you to join <strong>Listali</strong>. It's the easiest way to manage shared grocery lists with family and friends in real-time.`
          : `<strong>${inviterName}</strong> sent you a join code for their shopping group on Listali.`),
    
    cta: isHebrew 
      ? (isNewUser ? 'להרשמה והצטרפות' : 'להזנת הקוד באפליקציה')
      : (isNewUser ? 'Sign Up & Join' : 'Enter Code in App'),
    
    dir: isHebrew ? 'rtl' : 'ltr'
  };

  try {
    return await resend.emails.send({
      from: 'Listali <invite@listali.co.il>',
      to,
      subject: content.subject,
      html: `
        <div dir="${content.dir}" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 15px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0;">Listali</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">${content.title}</p>
          </div>

          <div style="padding: 30px; text-align: ${content.dir === 'rtl' ? 'right' : 'left'};">
            <p style="font-size: 16px; color: #333;">${content.description}</p>
            
            <div style="background: #f0f7ff; border-radius: 10px; padding: 20px; margin: 25px 0; border: 2px dashed #0070f3; text-align: center;">
              <span style="display: block; color: #666; font-size: 13px; margin-bottom: 5px;">${isHebrew ? 'קוד הקבוצה שלכם:' : 'Your group code:'}</span>
              <strong style="font-size: 32px; color: #0070f3; letter-spacing: 3px;">${code}</strong>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${actionUrl}" 
                 style="background-color: #0070f3; color: white; padding: 14px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                ${content.cta}
              </a>
            </div>
            
            ${isNewUser ? `
            <p style="font-size: 12px; color: #999; margin-top: 25px; text-align: center;">
              ${isHebrew ? 'ההרשמה לוקחת פחות מדקה והיא חינמית לגמרי.' : 'Registration takes less than a minute and is completely free.'}
            </p>` : ''}
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending group invite email:', error);
    throw error;
  }
}