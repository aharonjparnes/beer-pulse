const axios = require('axios');

async function sendInstagram() {
    const { APIFY_TOKEN, TELEGRAM_TOKEN } = process.env;
    const ACTOR_ID = "apify/instagram-post-scraper"; 
    const CHAT_ID = "@beerpulsenews";

    try {
        console.log("--- תחילת עדכון אינסטגרם ---");
        const runsUrl = `https://api.apify.com/v2/actor-runs?token=${APIFY_TOKEN}&actorId=${ACTOR_ID}&limit=1&desc=1`;
        const runsResponse = await axios.get(runsUrl);
        const lastRun = runsResponse.data.data.items[0];

        if (!lastRun || lastRun.status !== 'SUCCEEDED') {
            console.log("לא נמצאה הרצה מוצלחת.");
            return;
        }

        const dataUrl = `https://api.apify.com/v2/datasets/${lastRun.defaultDatasetId}/items?token=${APIFY_TOKEN}&limit=20&desc=1`;
        const dataResponse = await axios.get(dataUrl);

        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

        const validPosts = dataResponse.data.filter(item => {
            // אינסטגרם משתמש לעיתים בשניות (Unix timestamp), לכן נבדוק את הפורמט [cite: 2026-01-23]
            const ts = item.timestamp || (item.latestPostsBeforeTimestamp ? item.latestPostsBeforeTimestamp * 1000 : null);
            const postDate = new Date(ts);
            return (item.caption || item.text) && item.url && postDate > fortyEightHoursAgo;
        });

        if (validPosts.length === 0) {
            console.log("לא נמצאו פוסטים חדשים באינסטגרם.");
            return;
        }

        const post = validPosts[0];
        const name = post.ownerUsername || post.ownerFullName || "מבשלה";
        const text = (post.caption || post.text || "").substring(0, 850);

        await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: `<b>📸 ${name} באינסטגרם</b>\n\n${text}\n\n🔗 <a href="${post.url}">לפוסט המלא באינסטגרם</a>`,
            parse_mode: 'HTML'
        });
        console.log(`הודעה נשלחה בהצלחה עבור אינסטגרם: ${name}`);
    } catch (e) { console.error("שגיאה באינסטגרם:", e.message); }
}
sendInstagram();
