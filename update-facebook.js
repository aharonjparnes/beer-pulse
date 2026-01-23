const axios = require('axios');

async function sendFacebook() {
    const { APIFY_TOKEN, TELEGRAM_TOKEN } = process.env;
    const ACTOR_ID = "apify~facebook-posts-scraper"; // מזהה הסורק הקבוע [cite: 2026-01-23]
    const CHAT_ID = "@beerpulsenews";

    try {
        // מציאת הריצה האחרונה של הסורק [cite: 2026-01-23]
        const runsUrl = `https://api.apify.com/v2/actor-runs?token=${APIFY_TOKEN}&actorId=${ACTOR_ID}&limit=1&desc=1`;
        const runsResponse = await axios.get(runsUrl);
        const lastRun = runsResponse.data.data.items[0];

        if (!lastRun || lastRun.status !== 'SUCCEEDED') return;

        // משיכת הנתונים מה-Dataset האחרון [cite: 2026-01-23]
        const dataUrl = `https://api.apify.com/v2/datasets/${lastRun.defaultDatasetId}/items?token=${APIFY_TOKEN}&limit=10&desc=1&clean=1`;
        const dataResponse = await axios.get(dataUrl);

        // סינון פוסטים אמיתיים (שמכילים טקסט ולינק) [cite: 2026-01-23]
        const post = dataResponse.data.find(item => (item.text || item.caption) && item.url);
        if (!post) return;

        const name = post.pageName || post.user || "מבשלה (Facebook)";
        const text = (post.text || post.caption || "").substring(0, 850);
        const url = post.url || `https://www.facebook.com/${post.facebookId}/posts/${post.postId}`;

        await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: `<b>🍺 ${name} 🍺</b>\n\n${text}\n\n🔗 <a href="${url}">לפוסט המלא בפייסבוק</a>`,
            parse_mode: 'HTML'
        });
    } catch (e) { console.error(e.message); }
}
sendFacebook();
