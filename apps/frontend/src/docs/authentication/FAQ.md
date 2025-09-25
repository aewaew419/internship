# Authentication System FAQ

## General Questions

### Q: What authentication methods are supported?

**A:** The system supports:
- **Student Login**: Using student ID (8-10 digits) and password
- **Admin Login**: Using email and password (separate form)
- **Password Reset**: Via email verification

### Q: Which browsers are supported?

**A:** The system supports all modern browsers:
- **Chrome** 90+ (Recommended)
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+
- **Mobile browsers** on iOS and Android

### Q: Is the system mobile-friendly?

**A:** Yes, the system is fully responsive and optimized for mobile devices:
- Touch-optimized button sizes (minimum 44px)
- Appropriate keyboard types for different inputs
- Responsive layouts that adapt to screen size
- Optimized for both portrait and landscape orientations

## Student Login

### Q: What format should my student ID be in?

**A:** Student IDs must be:
- **8-10 digits long**
- **Numbers only** (no letters or special characters)
- **Examples**: `12345678`, `1234567890`

### Q: Why can't I use my email to log in?

**A:** For security and system integration purposes, students must use their student ID. This ensures:
- Unique identification within the university system
- Better integration with existing university databases
- Reduced risk of account confusion

### Q: I have an 11-digit student ID, but the system won't accept it. Why?

**A:** The system currently supports student IDs with 8-10 digits. If your student ID has 11 digits:
- Double-check your student ID format
- Contact the IT support team for assistance
- There may be a system update needed to support longer IDs

### Q: Can I change my password?

**A:** Yes, after logging in:
1. Go to your profile/account settings
2. Look for "Change Password" option
3. Enter your current password and new password
4. Confirm the change

## Password Management

### Q: I forgot my password. How do I reset it?

**A:** To reset your password:
1. Click "ลืมรหัสผ่าน?" (Forgot Password?) on the login form
2. Enter your student ID
3. Check your registered email for a reset link
4. Click the link and set a new password
5. The link expires after 24 hours for security

### Q: I'm not receiving the password reset email. What should I do?

**A:** Try these steps:
1. **Check spam/junk folder** - reset emails sometimes go there
2. **Wait a few minutes** - email delivery can be delayed
3. **Verify your student ID** - make sure you entered it correctly
4. **Check if your email is registered** - contact support if unsure
5. **Try again** - you can request multiple reset emails

### Q: How secure are passwords in the system?

**A:** Passwords are protected using:
- **Encryption** during transmission (HTTPS)
- **Hashing** for storage (not stored in plain text)
- **Rate limiting** to prevent brute force attacks
- **Session management** with automatic timeouts

### Q: What makes a strong password?

**A:** A strong password should:
- Be at least 8 characters long
- Include a mix of uppercase and lowercase letters
- Contain numbers and special characters
- Not be a common word or personal information
- Be unique to this system

## Security Features

### Q: Why am I seeing "การเข้าสู่ระบบถูกจำกัดชั่วคราว"?

**A:** This message appears when:
- **Multiple failed login attempts** have been detected
- **Security system** is protecting against potential attacks
- **Wait time**: Usually 15-30 minutes before you can try again
- **Prevention**: Ensure you're using correct credentials

### Q: How many login attempts do I have?

**A:** The system allows:
- **5 failed attempts** before temporary lockout
- **Warning messages** when you have 2 attempts remaining
- **Automatic reset** after the lockout period expires

### Q: Is my data safe when using the system?

**A:** Yes, the system implements multiple security measures:
- **HTTPS encryption** for all data transmission
- **Secure authentication** protocols
- **Session management** with automatic timeouts
- **Input validation** and sanitization
- **CSRF protection** against cross-site attacks
- **Rate limiting** to prevent abuse

### Q: How long do login sessions last?

**A:** Login sessions:
- **Default duration**: 8 hours of activity
- **Automatic extension**: When you're actively using the system
- **Warning**: You'll get a warning 5 minutes before timeout
- **Manual logout**: Always available in the user menu

## Accessibility Features

### Q: Does the system support screen readers?

**A:** Yes, the system fully supports screen readers:
- **NVDA** (Windows)
- **JAWS** (Windows)
- **VoiceOver** (macOS/iOS)
- **TalkBack** (Android)

Features include:
- Proper ARIA labels and descriptions
- Live region announcements for status updates
- Keyboard navigation support
- Error announcements

### Q: Can I use the system with only a keyboard?

**A:** Yes, full keyboard navigation is supported:
- **Tab**: Move to next element
- **Shift+Tab**: Move to previous element
- **Enter**: Submit forms or activate buttons
- **Escape**: Close modals or dialogs
- **Arrow keys**: Navigate within certain components

### Q: How do I enable high contrast mode?

**A:** To enable high contrast mode:
1. Look for the accessibility controls button (⚙️) in the top-right corner
2. Click to open the accessibility panel
3. Toggle "โหมดคอนทราสต์สูง" (High Contrast Mode)
4. The page will immediately switch to high contrast colors

### Q: Can I make the text larger?

**A:** Yes, you can adjust text size:
1. Open the accessibility controls panel
2. Use the "ขนาดตัวอักษร" (Text Size) slider
3. Adjust from 80% to 150% of normal size
4. Changes apply immediately to all text

### Q: What is "reduced motion" mode?

**A:** Reduced motion mode:
- **Disables animations** and transitions
- **Helpful for users** who experience motion sensitivity
- **Improves performance** on slower devices
- **Can be toggled** in accessibility controls

## Technical Issues

### Q: The page is loading slowly. What can I do?

**A:** Try these solutions:
1. **Check internet connection** - ensure stable connectivity
2. **Refresh the page** - press F5 or Ctrl+R
3. **Clear browser cache** - may resolve loading issues
4. **Try different browser** - to isolate browser-specific issues
5. **Check system status** - there may be maintenance ongoing

### Q: I'm getting JavaScript errors. How do I fix them?

**A:** JavaScript errors can be resolved by:
1. **Refreshing the page** - often fixes temporary issues
2. **Clearing browser cache** - removes corrupted cached files
3. **Disabling browser extensions** - some extensions interfere
4. **Updating your browser** - ensure you have the latest version
5. **Trying incognito/private mode** - isolates extension issues

### Q: The form isn't submitting. What's wrong?

**A:** Common causes and solutions:
1. **Validation errors** - check for red error messages
2. **Network issues** - verify internet connection
3. **JavaScript disabled** - ensure JavaScript is enabled
4. **Browser compatibility** - try a different browser
5. **Form data issues** - ensure all required fields are filled

### Q: Why do I see a "Network Error" message?

**A:** Network errors can occur due to:
- **Internet connectivity issues**
- **Server maintenance**
- **Firewall restrictions**
- **VPN interference**

**Solutions:**
- Check your internet connection
- Try again in a few minutes
- Disable VPN temporarily
- Contact IT support if persistent

## Mobile-Specific Questions

### Q: Why isn't the numeric keyboard showing for student ID?

**A:** The numeric keyboard should appear automatically. If not:
1. **Tap directly** in the student ID field
2. **Check keyboard settings** - ensure numeric keyboard is available
3. **Try refreshing** the page
4. **Switch keyboards manually** if your device allows it

### Q: The buttons are too small on my phone. Can I make them bigger?

**A:** The system automatically optimizes button sizes for mobile devices. If they're still too small:
1. **Use accessibility controls** to increase text size
2. **Zoom the page** using browser zoom (pinch gesture)
3. **Rotate to landscape** mode for more space
4. **Check if you're using the mobile-optimized version**

### Q: Can I use the system on my tablet?

**A:** Yes, the system works well on tablets:
- **Responsive design** adapts to tablet screen sizes
- **Touch-optimized** interface elements
- **Both orientations** supported (portrait/landscape)
- **All features available** just like on desktop

## Performance Questions

### Q: Why is the system using a lot of memory?

**A:** The system is optimized for performance, but high memory usage can occur due to:
- **Multiple browser tabs** open
- **Browser extensions** consuming memory
- **Cached data** accumulating over time

**Solutions:**
- Close unnecessary browser tabs
- Disable unused browser extensions
- Clear browser cache periodically
- Restart your browser

### Q: How can I improve the system's performance?

**A:** To optimize performance:
1. **Use Chrome browser** (recommended for best performance)
2. **Close unnecessary tabs** and applications
3. **Clear browser cache** regularly
4. **Disable unused extensions**
5. **Ensure stable internet** connection
6. **Keep browser updated**

### Q: Does the system work offline?

**A:** Limited offline functionality:
- **Form data** is saved locally to prevent loss
- **Login attempts** require internet connection
- **Cached pages** may be available briefly
- **Full functionality** requires internet connection

## Admin-Specific Questions

### Q: How is admin login different from student login?

**A:** Admin login differences:
- **Uses email** instead of student ID
- **Separate login form** at `/admin/login`
- **Different permissions** and access levels
- **Enhanced security** features
- **Admin dashboard** access after login

### Q: Can I have both student and admin accounts?

**A:** This depends on your role and system configuration:
- **Contact IT support** to discuss your specific needs
- **Separate credentials** may be required for each role
- **Different access levels** apply to each account type

## Data and Privacy

### Q: What data does the system collect?

**A:** The system collects:
- **Login credentials** (student ID, password)
- **Session information** (login time, IP address)
- **Usage analytics** (anonymized performance data)
- **Error logs** (for system improvement)

### Q: How is my privacy protected?

**A:** Privacy protection measures:
- **Data encryption** in transit and at rest
- **Minimal data collection** - only what's necessary
- **No sharing** with third parties without consent
- **Compliance** with university privacy policies
- **Right to access** your data upon request

### Q: Can I delete my account data?

**A:** Account data deletion:
- **Contact IT support** for data deletion requests
- **Academic records** may need to be retained per university policy
- **Login logs** may be kept for security purposes
- **Process time** varies depending on data type

## Getting Help

### Q: Who should I contact for technical support?

**A:** Contact information:
- **Email**: support@university.ac.th
- **Phone**: 02-XXX-XXXX ext. 1234
- **Hours**: Monday-Friday, 8:30 AM - 4:30 PM
- **Emergency**: 24/7 hotline for critical issues

### Q: What information should I provide when reporting an issue?

**A:** Include these details:
- **Student ID** (for identification)
- **Browser and version** (e.g., Chrome 95)
- **Operating system** (Windows 10, macOS, etc.)
- **Device type** (desktop, mobile, tablet)
- **Error messages** (exact text or screenshots)
- **Steps to reproduce** the issue
- **When it started** happening

### Q: How quickly will my issue be resolved?

**A:** Response times:
- **Critical issues**: 2 hours
- **General problems**: 1 business day
- **Feature requests**: 2-3 business days
- **Account issues**: Same day during business hours

### Q: Is there a user manual available?

**A:** Yes, documentation is available:
- **User Guide** (Thai): Comprehensive usage instructions
- **Technical Documentation**: For developers and IT staff
- **Video Tutorials**: Step-by-step visual guides
- **FAQ** (this document): Common questions and answers

### Q: Can I suggest improvements to the system?

**A:** Absolutely! We welcome feedback:
- **Email suggestions** to support@university.ac.th
- **Include specific details** about your suggestion
- **Explain the benefit** it would provide
- **Regular reviews** of suggestions are conducted
- **Implementation** depends on feasibility and priority

---

**Last Updated:** [Current Date]  
**Version:** 1.0

**Note:** This FAQ is regularly updated. If you have a question not covered here, please contact support and we'll add it to future versions.