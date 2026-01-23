const axios = require('axios');

async function sendFacebook() {
    const { APIFY_TOKEN, TELEGRAM_TOKEN } = process.env;
    const ACTOR_ID = "apify~facebook-posts-scraper"; 
    const CHAT_ID = "@beerpulsenews";

    try {
        console.log("מתחיל סריקה חכמה למניעת כפילויות ופוסטים נעוצים...");
        
        const runsUrl = `https://api.apify.com/v2/actor-runs?token=${APIFY_TOKEN}&actorId=${ACTOR_ID}&limit=1&desc=1`;
        const runsResponse = await axios.get(runsUrl);
        const lastRun = runsResponse.data.data.items[0];

        if (!lastRun || lastRun.status !== 'SUCCEEDED') return;

        const dataUrl = `https://api.apify.com/v2/datasets/${lastRun.defaultDatasetId}/items?token=${APIFY_TOKEN}&limit=20&desc=1&clean=1`;
        const dataResponse = await axios.get(dataUrl);

        // הגדרת זמן: אנחנו מחפשים פוסטים מה-24 שעות האחרונות בלבד
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // סינון: 1. יש טקסט ולינק. 2. לא ישן יותר מיום (מונע שליחת פוסטים נעוצים ישנים).
        const validPosts = dataResponse.data.filter(item => {
            const postDate = new Date(item.time || item.timestamp || item.date);
            return (item.text || item.caption) && item.url && postDate > twentyFourHoursAgo;
        });

        if (validPosts.length === 0) {
            console.log("לא נמצאו פוסטים חדשים מהיממה האחרונה (מונע שליחת נעוצים).");
            return;
        }

        // לוקחים את הפוסט הכי חדש מתוך הרשימה המסוננת
        const post = validPosts[0];

        const name = post.pageName || post.user || "מבשלה";
        const text = (post.text || post.caption || "").substring(0, 850);
        const url = post.url;

        await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: `<b>🍺 ${name} 🍺</b>\n\n${text}\n\n🔗 <a href="${url}">לפוסט המלא בפייסבוק</a>`,
            parse_mode: 'HTML'
        });

        console.log(`הודעה נשלחה בהצלחה עבור פוסט מתאריך: ${post.time || post.date}`);

    } catch (e) { console.error("שגיאה:", e.message); }
}
sendFacebook();
