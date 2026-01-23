const axios = require('axios');

async function sendInstagram() {
    const { APIFY_TOKEN, TELEGRAM_TOKEN } = process.env;
    const ACTOR_ID = "apify~instagram-scraper"; // מזהה סורק האינסטגרם [cite: 2026-01-23]
    const CHAT_ID = "@beerpulsenews";

    try {
        const runsUrl = `https://api.apify.com/v2/actor-runs?token=${APIFY_TOKEN}&actorId=${ACTOR_ID}&limit=1&desc=1`;
        const runsResponse = await axios.get(runsUrl);
        const lastRun = runsResponse.data.data.items[0];

        if (!lastRun || lastRun.status !== 'SUCCEEDED') return;

        const dataUrl = `https://api.apify.com/v2/datasets/${lastRun.defaultDatasetId}/items?token=${APIFY_TOKEN}&limit=5&desc=1`;
        const dataResponse = await axios.get(dataUrl);

        const post = dataResponse.data[0];
        if (!post) return;

        const name = post.ownerUsername || post.ownerFullName || "מבשלה (Instagram)";
        const text = (post.caption || "פוסט חדש!").substring(0, 850);
        const url = post.url || `https://www.instagram.com/p/${post.shortCode}/`;

        await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: `<b>📸 ${name} באינסטגרם</b>\n\n${text}\n\n🔗 <a href="${url}">לפוסט המלא</a>`,
            parse_mode: 'HTML'
        });
    } catch (e) { console.error(e.message); }
}
sendInstagram();
