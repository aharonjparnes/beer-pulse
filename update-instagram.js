const axios = require('axios');

async function sendInstagram() {
    const { APIFY_TOKEN, TELEGRAM_TOKEN } = process.env;
    const ACTOR_ID = "apify~instagram-scraper"; // מזהה סורק האינסטגרם הקבוע [cite: 2026-01-23]
    const CHAT_ID = "@beerpulsenews";

    try {
        console.log("מתחיל סריקה חכמה לאינסטגרם (בדיקת פוסטים חדשים בלבד)...");

        // 1. משיכת הריצה האחרונה של הסורק [cite: 2026-01-23]
        const runsUrl = `https://api.apify.com/v2/actor-runs?token=${APIFY_TOKEN}&actorId=${ACTOR_ID}&limit=1&desc=1`;
        const runsResponse = await axios.get(runsUrl);
        const lastRun = runsResponse.data.data.items[0];

        if (!lastRun || lastRun.status !== 'SUCCEEDED') {
            console.log("לא נמצאה הרצה מוצלחת לאינסטגרם.");
            return;
        }

        // 2. משיכת הנתונים מה-Dataset האחרון [cite: 2026-01-23]
        const dataUrl = `https://api.apify.com/v2/datasets/${lastRun.defaultDatasetId}/items?token=${APIFY_TOKEN}&limit=15&desc=1`;
        const dataResponse = await axios.get(dataUrl);

        // 3. הגדרת טווח זמן (פוסטים מה-24 שעות האחרונות) [cite: 2026-01-23]
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // 4. סינון פוסטים: רק כאלו שיש להם טקסט/תמונה והם פורסמו ביממה האחרונה [cite: 2026-01-23]
        const validPosts = dataResponse.data.filter(item => {
            const postDate = new Date(item.timestamp || item.latestPostsBeforeTimestamp * 1000 || item.inputUrl); 
            // הערה: אינסטגרם לעיתים משתמש ב-Timestamp בשניות, לכן הכפלנו ב-1000 [cite: 2026-01-23]
            return (item.caption || item.text) && item.url && postDate > twentyFourHoursAgo;
        });

        if (validPosts.length === 0) {
            console.log("לא נמצאו פוסטים חדשים באינסטגרם מהיממה האחרונה (דילוג על נעוצים).");
            return;
        }

        // לקיחת הפוסט הכי חדש שנמצא [cite: 2026-01-23]
        const post = validPosts[0];
        const name = post.ownerUsername || post.ownerFullName || "מבשלה (Instagram)";
        const text = (post.caption || post.text || "תמונה חדשה!").substring(0, 850);
        const url = post.url || `https://www.instagram.com/p/${post.shortCode}/`;

        // 5. שליחה לטלגרם [cite: 2026-01-23]
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: `<b>📸 ${name} באינסטגרם</b>\n\n${text}\n\n🔗 <a href="${url}">לפוסט המלא באינסטגרם</a>`,
            parse_mode: 'HTML',
            disable_web_page_preview: false
        });

        console.log(`הודעה נשלחה בהצלחה עבור אינסטגרם: ${name}`);

    } catch (e) {
        console.error("שגיאה באינסטגרם:", e.message);
    }
}

sendInstagram();
