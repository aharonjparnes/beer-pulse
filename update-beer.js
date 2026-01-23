const axios = require('axios');

async function sendBeerUpdate() {
    const { APIFY_TOKEN, TELEGRAM_TOKEN, DATASET_ID } = process.env;
    const CHAT_ID = "@beerpulsenews";

    try {
        // משיכת פריטים עם פרמטרים שמוודאים קבלת נתונים נקיים
        const apifyUrl = `https://api.apify.com/v2/datasets/${DATASET_ID}/items?token=${APIFY_TOKEN}&limit=20&desc=1&clean=1`;
        const response = await axios.get(apifyUrl);
        
        if (!response.data || response.data.length === 0) return;

        // חקר ה-API מראה שצריך לסנן אובייקטים שהם לא פוסטים (כמו 'profile' או 'comment') [cite: 2026-01-23]
        const post = response.data.find(item => 
            (item.text || item.caption) && 
            item.url && 
            !item.url.includes('/about') && 
            !item.url.includes('/photos_by')
        );

        if (!post) {
            console.log("לא נמצא פוסט תקין בסריקה האחרונה.");
            return;
        }

        // חילוץ שם המבשלה בצורה אמינה יותר
        const breweryName = post.pageName || post.user || post.userName || "מבשלה";
        
        // בניית ה-URL: אם הקישור שבור, אנחנו בונים אותו ממזהה הפוסט [cite: 2026-01-23]
        let finalUrl = post.url;
        if (post.facebookId && post.postId && (!finalUrl || !finalUrl.includes('posts'))) {
            finalUrl = `https://www.facebook.com/${post.facebookId}/posts/${post.postId}`;
        }

        const rawText = post.text || post.caption || "פוסט חדס עלה לעמוד!";
        const cleanText = rawText.replace(/<[^>]*>?/gm, ''); // ניקוי תגיות HTML מהטקסט המקורי [cite: 2026-01-23]
        const shortText = cleanText.length > 800 ? cleanText.substring(0, 800) + "..." : cleanText;

        // שימוש ב-HTML מתקדם של טלגרם (Bold וקישורים מוטמעים) [cite: 2026-01-23]
        const message = `<b>🍺 עדכון מבשלה: ${breweryName} 🍺</b>\n\n${shortText}\n\n🔗 <a href="${finalUrl}">לחצו כאן לפוסט המלא בפייסבוק</a>`;

        const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
        
        await axios.post(telegramUrl, {
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'HTML',
            disable_web_page_preview: false // קריטי להצגת התמונה אוטומטית [cite: 2026-01-23]
        });

        console.log(`נשלח בהצלחה: ${breweryName}`);

    } catch (error) {
        console.error("שגיאה ב-API של טלגרם:", error.response ? error.response.data : error.message);
    }
}

sendBeerUpdate();
